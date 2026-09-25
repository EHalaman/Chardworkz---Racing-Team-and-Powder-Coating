import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription, catchError, debounceTime, merge, of } from 'rxjs';
import { AuthService } from '../../core/auth';
import { SalesEventsService } from '../../core/sales-events';
import { formatPHMobileAsTyped, isValidPHMobileNumber } from '../../core/utils/ph-phone.util';
import { OfflineSaleQueueService } from '../../offline-sales/offline-sale-queue';
import { ProductsService, ProductSummary } from '../../products/products';
import { SaleReceipt, SalesService } from '../sales';
import { ShiftSummary, ShiftSummaryService } from '../shift-summary';

interface CartLine {
  product: ProductSummary;
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
  readonly paymentMethod = signal<PaymentMethod>('CASH');
  readonly successMessage = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly shiftSummary = signal<ShiftSummary | null>(null);

  readonly activeReceipt = signal<SaleReceipt | null>(null);
  readonly isReceiptClosing = signal(false);
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

  /** Resets isReceiptClosing in case a close's pending timeout (see closeReceipt()) hasn't fired yet - otherwise this new receipt would render mid-exit-animation and then get wrongly dismissed when that stale timeout does fire. */
  reprint(sale: SaleReceipt): void {
    this.isReceiptClosing.set(false);
    this.activeReceipt.set(sale);
  }

  /**
   * Same delayed-unmount trick as toggleDrawer(), keyed off activeReceipt
   * itself instead of a separate mounted flag since it already doubles as
   * one. The isReceiptClosing() re-check guards the same close-then-reopen
   * race toggleDrawer() has: without it, closing then immediately reprinting
   * another sale within 180ms would have this stale callback null out the
   * newly reprinted receipt instead of the one that was actually closed.
   */
  closeReceipt(): void {
    this.isReceiptClosing.set(true);
    setTimeout(() => {
      if (this.isReceiptClosing()) {
        this.activeReceipt.set(null);
        this.isReceiptClosing.set(false);
      }
    }, 180);
  }

  printReceipt(): void {
    window.print();
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

  addToCart(product: ProductSummary): void {
    this.cart.update((lines) => {
      const existing = lines.find((l) => l.product.id === product.id);
      if (existing) {
        return lines.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...lines, { product, quantity: 1 }];
    });
  }

  adjustQuantity(productId: number, delta: number): void {
    this.cart.update((lines) =>
      lines
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  removeLine(productId: number): void {
    this.cart.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  clearCart(): void {
    this.cart.set([]);
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

    const saleId = await this.queue.enqueueSale({
      paymentMethod: this.paymentMethod(),
      paymentReference: paymentReference || null,
      customerName: trimmedCustomerName,
      customerPhone,
      customerEmail: trimmedCustomerEmail,
      lines: lines.map((l) => ({
        productId: l.product.id,
        quantity: l.quantity,
        unitPrice: l.product.unitPrice,
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
      subtotal: total,
      total,
      lines: lines.map((l) => ({
        productName: l.product.name,
        category: l.product.category,
        quantity: l.quantity,
        unitPrice: l.product.unitPrice,
        lineTotal: l.product.unitPrice * l.quantity,
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
