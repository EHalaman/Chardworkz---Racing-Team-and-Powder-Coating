import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription, catchError, debounceTime, merge, of } from 'rxjs';
import { AuthService } from '../../core/auth';
import { SalesEventsService } from '../../core/sales-events';
import { formatPHMobileAsTyped, isValidPHMobileNumber } from '../../core/utils/ph-phone.util';
import { OfflineSaleQueueService } from '../../offline-sales/offline-sale-queue';
import { ProductsService, ProductSummary } from '../../products/products';
import { PackageComponent, PackagesService, ServicePackage } from '../packages';
import { SaleReceipt, SalesService } from '../sales';
import { ShiftSummary, ShiftSummaryService } from '../shift-summary';

interface CartLine {
  product: ProductSummary;
  quantity: number;
  /** Set only when this line came from a package selection (DEC-084) - null for a plain individually-added line. */
  packageId: number | null;
  /**
   * Unique per add-to-cart action (DEC-087, crypto.randomUUID()), distinct
   * from packageId (the package template's own id). Lets the same package be
   * added to the cart more than once without its lines/removed-component
   * state getting mixed together, and is what removePackageGroup/purge key
   * off of - packageId alone can't tell two separately-added instances of
   * "Engine Upgrade 206 CC Fi Package" apart.
   */
  packageInstanceId: string | null;
  packageName: string | null;
  /** True only for a package's locked labor/service line (PackageComponent.required) - the cart never renders quantity or remove controls for one; the whole package must be removed instead (see removePackageGroup). Always false for a plain or optional-part line. */
  required: boolean;
}

/** One package component the cashier excluded (pre-add drawer or post-add cart removal), tied to the instance it came from so it can be purged when that whole package is removed, or restored via Re-add. */
interface ExcludedPackageComponent {
  packageInstanceId: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

type PaymentMethod = 'CASH' | 'GCASH' | 'EWALLET_OTHER';

/** Friendly labels for the two known branches - matches the same static mapping already used in Inventory/Reports. Kept local rather than a network round-trip so the receipt still renders offline. */
const BRANCH_NAMES: Record<string, string> = {
  MAIN: 'Main Branch',
  MASINAG: 'Masinag Branch',
};

/** Collapses a burst of near-simultaneous SALE_RECORDED events (e.g. an offline register reconnecting and syncing several queued sales at once) into a single refresh instead of one per event - flagged by /code-review on the first version of this wiring. */
const SSE_REFRESH_DEBOUNCE_MS = 500;

@Component({
  selector: 'app-register',
  standalone: false,
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register implements OnInit, OnDestroy {
  readonly products = signal<ProductSummary[]>([]);
  readonly searchTerm = signal('');
  readonly cart = signal<CartLine[]>([]);
  /** Free-text notes the cashier typed directly into the checkout drawer. */
  readonly cashierRemarks = signal('');
  /** Auto-generated per excluded package component (see addPackageToCart/removeLine) - kept separate from cashierRemarks so a cashier editing their own note can never accidentally erase one of these. Rendered/formatted via formattedExclusionsBlock, not stored as pre-formatted text, so purging (removePackageGroup) and Re-add (reAddComponent) can operate on structured entries instead of string-matching. */
  readonly excludedComponents = signal<ExcludedPackageComponent[]>([]);
  readonly paymentMethod = signal<PaymentMethod>('CASH');
  readonly successMessage = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly shiftSummary = signal<ShiftSummary | null>(null);

  readonly packages = signal<ServicePackage[]>([]);
  /** The package currently open in the customization drawer, or null when it's closed. */
  readonly activePackage = signal<ServicePackage | null>(null);
  /** productIds the cashier has unchecked for the package currently open in the drawer. */
  readonly packageExclusions = signal<Set<number>>(new Set());

  readonly activeReceipt = signal<SaleReceipt | null>(null);
  readonly isDrawerOpen = signal(false);
  readonly isDrawerMounted = signal(false);
  readonly isToastLeaving = signal(false);
  readonly recentTransactions = signal<SaleReceipt[]>([]);
  readonly recentTransactionsError = signal<string | null>(null);
  readonly transactionSearchTerm = signal('');

  /** Live-formatted "9XX XXX XXXX" local part - the +63 badge next to the input covers the country code (ph-mobile-number-sanitizing pattern). */
  readonly customerPhoneDisplay = signal('');

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'GCASH', label: 'GCash' },
    { value: 'EWALLET_OTHER', label: 'Other e-wallet' },
  ];

  private saleEventsSub?: Subscription;

  constructor(
    private productsService: ProductsService,
    private packagesService: PackagesService,
    private queue: OfflineSaleQueueService,
    private shiftSummaryService: ShiftSummaryService,
    private salesService: SalesService,
    readonly auth: AuthService,
    private salesEventsService: SalesEventsService,
  ) {}

  ngOnInit(): void {
    // No branch filtering needed here, unlike Dashboard/Reports - Register
    // is never Owner-accessible (see Layout.ALL_NAV_ITEMS), and a non-Owner
    // account only ever receives SSE events for its own branch in the first
    // place (SseEmitterRegistry#sendToBranch). See
    // docs/realtime-sales-sync-spec-2026-09-25.md.
    this.saleEventsSub = merge(
      this.salesEventsService.saleRecorded$,
      this.salesEventsService.reconnected$,
    )
      .pipe(debounceTime(SSE_REFRESH_DEBOUNCE_MS))
      .subscribe(() => {
        this.loadShiftSummary();
        this.loadRecentTransactions();
      });
    this.productsService.list().subscribe({
      next: (products) => this.products.set(products),
      // Client-side search below still works against whatever loaded before
      // a connectivity drop - only the initial fetch can fail like this.
      error: () => this.loadError.set('Could not load products. Check your connection and reload.'),
    });
    this.packagesService.list().subscribe({
      next: (packages) => this.packages.set(packages),
      // Non-fatal: packages are a DEC-084 add-on, plain product sales must
      // keep working even if this fetch fails.
      error: () => this.packages.set([]),
    });
    this.loadShiftSummary();
    this.loadRecentTransactions();
  }

  ngOnDestroy(): void {
    this.saleEventsSub?.unsubscribe();
  }

  get isEmployee(): boolean {
    return this.auth.currentUser()?.role === 'EMPLOYEE';
  }

  /**
   * Won't let a fetch that raced ahead of a just-completed sale's background
   * sync (same cause as loadRecentTransactions() below) regress the
   * transaction count/totals completeSale() already bumped optimistically -
   * takes the higher of the two for those fields, but still adopts whatever
   * the fetch says for margin/byBranch, which aren't computable client-side.
   */
  private loadShiftSummary(): void {
    this.shiftSummaryService
      .today()
      .pipe(catchError(() => of(null)))
      .subscribe((summary) => {
        this.shiftSummary.update((current) => {
          if (!summary) {
            return current;
          }
          if (!current || summary.transactionsCount >= current.transactionsCount) {
            return summary;
          }
          return {
            ...summary,
            transactionsCount: current.transactionsCount,
            cashTotal: current.cashTotal,
            ewalletTotal: current.ewalletTotal,
          };
        });
      });
  }

  /**
   * Merges rather than overwrites: completeSale() prepends a sale here
   * optimistically before it has necessarily synced (enqueueSale() only
   * awaits the IndexedDB write, not the background network sync - a
   * same-tick reload used to always race ahead of it and win, silently
   * dropping the just-completed sale until the next unrelated reload). Any
   * optimistic entry the server doesn't know about yet is kept until a
   * later fetch confirms it (by id), so nothing is ever lost or duplicated.
   */
  private loadRecentTransactions(): void {
    this.salesService.today().subscribe({
      next: (sales) => {
        this.recentTransactionsError.set(null);
        this.recentTransactions.update((current) => {
          const fetchedIds = new Set(sales.map((s) => s.id));
          const stillOptimistic = current.filter((s) => !fetchedIds.has(s.id));
          return [...stillOptimistic, ...sales].sort((a, b) => b.soldAt.localeCompare(a.soldAt));
        });
      },
      error: () => this.recentTransactionsError.set('Could not load recent transactions.'),
    });
  }

  /**
   * Keeps the drawer mounted for the duration of its slide-out animation -
   * an *ngIf tied straight to isDrawerOpen would rip the panel out of the
   * DOM instantly and skip the exit transition entirely. The isDrawerOpen()
   * re-check inside the timeout guards against a close-then-reopen within
   * the 220ms window: without it, this stale callback would unmount the
   * drawer right after the reopen had just mounted it, leaving the toggle
   * button reading "Close" over an invisible, unmounted panel.
   */
  toggleDrawer(): void {
    if (this.isDrawerOpen()) {
      this.isDrawerOpen.set(false);
      setTimeout(() => {
        if (!this.isDrawerOpen()) {
          this.isDrawerMounted.set(false);
        }
      }, 220);
    } else {
      this.isDrawerMounted.set(true);
      this.isDrawerOpen.set(true);
    }
  }

  onCustomerPhoneInput(value: string): void {
    this.customerPhoneDisplay.set(formatPHMobileAsTyped(value));
  }

  /**
   * Non-blocking warning only - a malformed phone never disables Complete
   * Sale (DEC-020/DEC-044 precedent: optional counter-sale fields shouldn't
   * slow down the line). Only fires once a full 10-digit attempt exists, so
   * it doesn't nag mid-keystroke.
   */
  get customerPhoneWarning(): string | null {
    const digits = this.customerPhoneDisplay().replace(/\s/g, '');
    if (digits.length < 10) {
      return null;
    }
    return isValidPHMobileNumber(digits) ? null : 'Enter a valid PH mobile number (9XXXXXXXXX).';
  }

  get filteredTransactions(): SaleReceipt[] {
    const term = this.transactionSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.recentTransactions();
    }
    return this.recentTransactions().filter(
      (sale) =>
        (sale.customerName ?? 'walk-in customer').toLowerCase().includes(term) ||
        sale.transactionNumber.toLowerCase().includes(term) ||
        sale.employeeName.toLowerCase().includes(term),
    );
  }

  /** The shared app-receipt-modal (DEC-087) resets its own tab/close-animation state whenever its [receipt] input changes, so a reprint while one is already open just needs a plain set() here. */
  reprint(sale: SaleReceipt): void {
    this.activeReceipt.set(sale);
  }

  get filteredProducts(): ProductSummary[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.products();
    }
    return this.products().filter(
      (p) => p.name.toLowerCase().includes(term) || (p.brandTag ?? '').toLowerCase().includes(term),
    );
  }

  get subtotal(): number {
    return this.cart().reduce((sum, line) => sum + line.product.unitPrice * line.quantity, 0);
  }

  /**
   * Compact vertical "Excluded:" block, one per package instance that has
   * any excluded components right now - replaces the old one-bullet-per-note
   * flat list, which accumulated duplicate/stale entries across repeated
   * add/customize/remove/re-add cycles on the same package (never purged
   * until the whole cart was cleared). padEnd on the name column lines up
   * cleanly since the remarks block renders in a monospace font
   * (receipt-modal.html, register.html).
   */
  get formattedExclusionsBlock(): string {
    const byInstance = new Map<string, ExcludedPackageComponent[]>();
    for (const entry of this.excludedComponents()) {
      const list = byInstance.get(entry.packageInstanceId) ?? [];
      list.push(entry);
      byInstance.set(entry.packageInstanceId, list);
    }
    if (byInstance.size === 0) {
      return '';
    }
    const nameWidth = Math.max(...this.excludedComponents().map((e) => e.productName.length));
    const blocks: string[] = [];
    for (const entries of byInstance.values()) {
      const rows = entries.map(
        (e) =>
          `    ${e.productName.padEnd(nameWidth)} | ${e.quantity} pcs | ₱${e.unitPrice.toFixed(2)}`,
      );
      blocks.push(['Excluded:', ...rows].join('\n'));
    }
    return blocks.join('\n\n');
  }

  /** Matches backend CreateSaleRequest.remarks' @Size(max = 2000) - truncated here so a long cashier note plus a large exclusions block can never fail that validation after the sale is already queued/optimistically shown as recorded. */
  private static readonly MAX_REMARKS_LENGTH = 2000;

  /** What actually gets submitted and printed - the cashier's own note first, then the compact exclusions block. */
  get combinedRemarks(): string {
    const combined = [this.cashierRemarks().trim(), this.formattedExclusionsBlock]
      .filter((r) => r)
      .join('\n\n');
    if (combined.length <= Register.MAX_REMARKS_LENGTH) {
      return combined;
    }
    // Cut on a whole-line boundary (a row sliced mid-price would no longer
    // match formatRemarksForCustomer's regex and would leak onto the customer
    // receipt), drop a dangling "Excluded:" header, and put the ellipsis on
    // its own line so it never attaches to a row's price.
    const cut = combined.slice(0, Register.MAX_REMARKS_LENGTH - 2);
    const lastNewline = cut.lastIndexOf('\n');
    const wholeLines = (lastNewline > 0 ? cut.slice(0, lastNewline) : cut)
      .replace(/\s*Excluded:\s*$/, '')
      .trimEnd();
    return wholeLines + '\n…';
  }

  addToCart(product: ProductSummary): void {
    this.cart.update((lines) => {
      const existing = lines.find(
        (l) => l.product.id === product.id && l.packageInstanceId === null,
      );
      if (existing) {
        return lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...lines,
        {
          product,
          quantity: 1,
          packageId: null,
          packageInstanceId: null,
          packageName: null,
          required: false,
        },
      ];
    });
  }

  /**
   * No-ops for a required (locked labor) line - the template hides its +/-
   * controls entirely, this is defense in depth against a stale click.
   * Decrementing an optional package line down to 0 routes through
   * removeLine() rather than just filtering it out here, so that path
   * records the same exclusion entry a click on ✕ would - previously it
   * silently dropped the line with no note, an inconsistency /code-review
   * flagged in the prior session.
   */
  adjustQuantity(productId: number, delta: number, packageInstanceId: string | null = null): void {
    const line = this.cart().find(
      (l) => l.product.id === productId && l.packageInstanceId === packageInstanceId,
    );
    if (!line || line.required) {
      return;
    }
    if (line.quantity + delta <= 0) {
      this.removeLine(productId, packageInstanceId);
      return;
    }
    this.cart.update((lines) =>
      lines.map((l) =>
        l.product.id === productId && l.packageInstanceId === packageInstanceId
          ? { ...l, quantity: l.quantity + delta }
          : l,
      ),
    );
  }

  /**
   * A required (locked labor) line can never be removed this way - the
   * template hides its remove control entirely (DEC-087 Requirement 2); this
   * is defense in depth. Removing an optional package component records an
   * ExcludedPackageComponent tied to its instance, so the printable receipt
   * and audit trail both record why the total came in lower than listed, and
   * so it can be purged (removePackageGroup) or undone (reAddComponent).
   */
  removeLine(productId: number, packageInstanceId: string | null = null): void {
    const removedLine = this.cart().find(
      (l) => l.product.id === productId && l.packageInstanceId === packageInstanceId,
    );
    if (!removedLine || removedLine.required) {
      return;
    }
    this.cart.update((lines) =>
      lines.filter(
        (l) => !(l.product.id === productId && l.packageInstanceId === packageInstanceId),
      ),
    );
    if (removedLine.packageInstanceId !== null) {
      this.excludedComponents.update((current) => [
        ...current,
        {
          packageInstanceId: removedLine.packageInstanceId!,
          productId: removedLine.product.id,
          productName: removedLine.product.name,
          unitPrice: removedLine.product.unitPrice,
          quantity: removedLine.quantity,
        },
      ]);
    }
  }

  /** Restores a previously-excluded component back into the cart at its original quantity, recalculating the total, and removes it from the exclusions list/remarks block. */
  reAddComponent(entry: ExcludedPackageComponent): void {
    const anchor = this.cart().find((l) => l.packageInstanceId === entry.packageInstanceId);
    const product = this.productFor(entry.productId);
    if (!anchor || !product) {
      return;
    }
    this.cart.update((lines) => [
      ...lines,
      {
        product,
        quantity: entry.quantity,
        packageId: anchor.packageId,
        packageInstanceId: anchor.packageInstanceId,
        packageName: anchor.packageName,
        required: false,
      },
    ]);
    this.excludedComponents.update((current) =>
      current.filter(
        (e) =>
          !(e.packageInstanceId === entry.packageInstanceId && e.productId === entry.productId),
      ),
    );
  }

  /** Every excluded-but-not-yet-restored component for one package instance - backs the inline "+ Re-add" chips in its cart container. */
  excludedComponentsFor(packageInstanceId: string): ExcludedPackageComponent[] {
    return this.excludedComponents().filter((e) => e.packageInstanceId === packageInstanceId);
  }

  /**
   * Removes an entire package's lines from the cart in one action - the only
   * way to remove its labor line, since individual removal is locked - and
   * purges every exclusion entry tied to that instance so the remarks block
   * never carries stale notes for a package that's no longer in the cart.
   * Re-adding the same package afterward generates a fresh instance id with
   * a completely clean exclusions state (DEC-087 Requirement 2).
   */
  removePackageGroup(packageInstanceId: string): void {
    this.cart.update((lines) => lines.filter((l) => l.packageInstanceId !== packageInstanceId));
    this.excludedComponents.update((current) =>
      current.filter((e) => e.packageInstanceId !== packageInstanceId),
    );
  }

  /** Groups cart() by packageInstanceId for nested rendering (register.html) - null is one group of standalone add-on lines, each package instance its own group, in first-seen order. */
  get groupedCart(): {
    packageInstanceId: string | null;
    packageId: number | null;
    packageName: string | null;
    lines: CartLine[];
  }[] {
    const groups: {
      packageInstanceId: string | null;
      packageId: number | null;
      packageName: string | null;
      lines: CartLine[];
    }[] = [];
    for (const line of this.cart()) {
      let group = groups.find((g) => g.packageInstanceId === line.packageInstanceId);
      if (!group) {
        group = {
          packageInstanceId: line.packageInstanceId,
          packageId: line.packageId,
          packageName: line.packageName,
          lines: [],
        };
        groups.push(group);
      }
      group.lines.push(line);
    }
    return groups;
  }

  clearCart(): void {
    this.cart.set([]);
    this.cashierRemarks.set('');
    this.excludedComponents.set([]);
  }

  /** productSummary lookup for a package component - the drawer needs live stock/active data the package endpoint deliberately doesn't duplicate (see PackageResponse). */
  private productFor(productId: number): ProductSummary | undefined {
    return this.products().find((p) => p.id === productId);
  }

  openPackageDrawer(pkg: ServicePackage): void {
    this.activePackage.set(pkg);
    this.packageExclusions.set(new Set());
  }

  closePackageDrawer(): void {
    this.activePackage.set(null);
    this.packageExclusions.set(new Set());
  }

  /** Required components can never be toggled off - see PackageComponent.required. */
  togglePackageComponent(component: PackageComponent): void {
    if (component.required) {
      return;
    }
    this.packageExclusions.update((excluded) => {
      const next = new Set(excluded);
      if (next.has(component.productId)) {
        next.delete(component.productId);
      } else {
        next.add(component.productId);
      }
      return next;
    });
  }

  isComponentExcluded(productId: number): boolean {
    return this.packageExclusions().has(productId);
  }

  /**
   * Dynamic recalculation: starts from the package's discounted `basePrice`
   * when the admin set one (DEC-085), else the live sum of components
   * (DEC-084's original behavior) - either way, every currently-unchecked
   * component's own line total is subtracted from that starting point.
   */
  get packageNetTotal(): number {
    const pkg = this.activePackage();
    if (!pkg) {
      return 0;
    }
    const excluded = this.packageExclusions();
    const startingTotal = pkg.basePrice ?? pkg.defaultTotal;
    const excludedTotal = pkg.components
      .filter((c) => excluded.has(c.productId))
      .reduce((sum, c) => sum + c.unitPrice * c.defaultQuantity, 0);
    return startingTotal - excludedTotal;
  }

  /**
   * Adds every non-excluded component as its own cart line, tagged with a
   * fresh packageInstanceId (DEC-087) so this add is tracked as its own
   * package instance in the cart - re-adding the same package later gets its
   * own instance id and a completely clean exclusions state, rather than
   * inheriting whatever this instance's remarks/removals were. Excluded
   * components are recorded the same way a post-add cart removal is (see
   * removeLine), so both moments feed the same compact remarks block.
   */
  addPackageToCart(): void {
    const pkg = this.activePackage();
    if (!pkg) {
      return;
    }
    const instanceId = crypto.randomUUID();
    const excluded = this.packageExclusions();
    const included = pkg.components.filter((c) => !excluded.has(c.productId));
    const newLines: CartLine[] = included
      .map((c): CartLine | null => {
        const product = this.productFor(c.productId);
        return product
          ? {
              product,
              quantity: c.defaultQuantity,
              packageId: pkg.id,
              packageInstanceId: instanceId,
              packageName: pkg.name,
              required: c.required,
            }
          : null;
      })
      .filter((l): l is CartLine => l !== null);
    this.cart.update((lines) => [...lines, ...newLines]);

    const excludedComponents = pkg.components.filter((c) => excluded.has(c.productId));
    if (excludedComponents.length > 0) {
      const entries: ExcludedPackageComponent[] = excludedComponents.map((c) => ({
        packageInstanceId: instanceId,
        productId: c.productId,
        productName: c.productName,
        unitPrice: c.unitPrice,
        quantity: c.defaultQuantity,
      }));
      this.excludedComponents.update((current) => [...current, ...entries]);
    }

    this.closePackageDrawer();
  }

  async completeSale(
    customerName: string,
    customerEmail: string,
    paymentReference: string,
  ): Promise<void> {
    const lines = this.cart();
    if (lines.length === 0) {
      return;
    }

    const total = lines.reduce((sum, l) => sum + l.product.unitPrice * l.quantity, 0);
    const trimmedCustomerName = customerName.trim() || null;
    const trimmedCustomerEmail = customerEmail.trim() || null;
    const phoneDigits = this.customerPhoneDisplay().replace(/\s/g, '');
    const customerPhone = phoneDigits ? `+63 ${this.customerPhoneDisplay()}` : null;
    const soldAt = new Date().toISOString();
    const remarks = this.combinedRemarks || null;

    const saleId = await this.queue.enqueueSale({
      paymentMethod: this.paymentMethod(),
      paymentReference: paymentReference || null,
      customerName: trimmedCustomerName,
      customerPhone,
      customerEmail: trimmedCustomerEmail,
      remarks,
      lines: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        unitPrice: l.product.unitPrice,
        packageId: l.packageId,
      })),
    });

    // Optimistic local decrement mirroring the server's eventual clamp-at-zero
    // (Q12 accepted-oversell decision) - the real number reconciles next fetch.
    const soldQuantities = new Map(lines.map((l) => [l.product.id, l.quantity]));
    this.products.update((products) =>
      products.map((p) => {
        const sold = soldQuantities.get(p.id);
        return sold ? { ...p, stockQuantity: Math.max(0, p.stockQuantity - sold) } : p;
      }),
    );

    // Display-only, not a real business key (see SaleReceiptResponse on the
    // backend) - derived from today's transaction count already loaded for
    // the Shift Summary widget, so the receipt renders instantly without
    // waiting on a network round-trip even if this sale is still offline-queued.
    const sequence = (this.shiftSummary()?.transactionsCount ?? 0) + 1;
    const datePart = soldAt.slice(0, 10).replace(/-/g, '');
    const branchCode = this.auth.currentUser()?.branchCode ?? '';

    const receipt: SaleReceipt = {
      id: saleId,
      transactionNumber: `TXN-${datePart}-${String(sequence).padStart(4, '0')}`,
      customerName: trimmedCustomerName,
      customerPhone,
      customerEmail: trimmedCustomerEmail,
      branchName: BRANCH_NAMES[branchCode] ?? branchCode,
      employeeName: this.auth.currentUser()?.fullName ?? '',
      soldAt,
      paymentMethod: this.paymentMethod(),
      paymentReference: paymentReference || null,
      remarks,
      subtotal: total,
      total,
      lines: lines.map((l) => ({
        productName: l.product.name,
        category: l.product.category,
        quantity: l.quantity,
        unitPrice: l.product.unitPrice,
        lineTotal: l.product.unitPrice * l.quantity,
        packageId: l.packageId,
        packageName: l.packageName,
      })),
    };

    this.activeReceipt.set(receipt);

    // Same instant-feedback reasoning as the receipt above: enqueueSale()
    // only awaits the local IndexedDB write, not the background network
    // sync, so the drawer/summary must not wait on a fetch that's racing
    // (and reliably loses) against that sync. loadRecentTransactions()
    // below merges this in safely once the fetch actually confirms it.
    this.recentTransactions.update((current) => [receipt, ...current]);
    this.shiftSummary.update((summary) => {
      if (!summary) {
        return summary;
      }
      const isCash = this.paymentMethod() === 'CASH';
      return {
        ...summary,
        transactionsCount: summary.transactionsCount + 1,
        cashTotal: summary.cashTotal + (isCash ? total : 0),
        ewalletTotal: summary.ewalletTotal + (isCash ? 0 : total),
      };
    });

    this.successMessage.set(`Sale recorded — ₱${total.toFixed(2)}. Syncing…`);
    this.isToastLeaving.set(false);
    this.clearCart();
    this.customerPhoneDisplay.set('');
    this.loadShiftSummary();
    this.loadRecentTransactions();
    setTimeout(() => this.isToastLeaving.set(true), 2700);
    setTimeout(() => {
      this.successMessage.set(null);
      this.isToastLeaving.set(false);
    }, 3000);
  }
}
