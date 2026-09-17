import { Component, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth';
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

@Component({
  selector: 'app-register',
  standalone: false,
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register implements OnInit {
  readonly products = signal<ProductSummary[]>([]);
  readonly searchTerm = signal('');
  readonly cart = signal<CartLine[]>([]);
  readonly paymentMethod = signal<PaymentMethod>('CASH');
  readonly successMessage = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly shiftSummary = signal<ShiftSummary | null>(null);

  readonly activeReceipt = signal<SaleReceipt | null>(null);
  readonly isDrawerOpen = signal(false);
  readonly recentTransactions = signal<SaleReceipt[]>([]);
  readonly recentTransactionsError = signal<string | null>(null);
  readonly transactionSearchTerm = signal('');

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'GCASH', label: 'GCash' },
    { value: 'EWALLET_OTHER', label: 'Other e-wallet' },
  ];

  constructor(
    private productsService: ProductsService,
    private queue: OfflineSaleQueueService,
    private shiftSummaryService: ShiftSummaryService,
    private salesService: SalesService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.productsService.list().subscribe({
      next: (products) => this.products.set(products),
      // Client-side search below still works against whatever loaded before
      // a connectivity drop - only the initial fetch can fail like this.
      error: () => this.loadError.set('Could not load products. Check your connection and reload.'),
    });
    this.loadShiftSummary();
    this.loadRecentTransactions();
  }

  get isEmployee(): boolean {
    return this.auth.currentUser()?.role === 'EMPLOYEE';
  }

  private loadShiftSummary(): void {
    this.shiftSummaryService
      .today()
      .pipe(catchError(() => of(null)))
      .subscribe((summary) => this.shiftSummary.set(summary));
  }

  /** Best-effort: only reflects sales already synced to the backend, so a just-completed offline-queued sale may not appear here until it syncs - the receipt modal already covers the "right after this sale" case regardless of sync state. */
  private loadRecentTransactions(): void {
    this.salesService.today().subscribe({
      next: (sales) => {
        this.recentTransactionsError.set(null);
        this.recentTransactions.set(sales);
      },
      error: () => this.recentTransactionsError.set('Could not load recent transactions.'),
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((open) => !open);
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

  reprint(sale: SaleReceipt): void {
    this.activeReceipt.set(sale);
  }

  closeReceipt(): void {
    this.activeReceipt.set(null);
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

  async completeSale(customerName: string, paymentReference: string): Promise<void> {
    const lines = this.cart();
    if (lines.length === 0) {
      return;
    }

    const total = lines.reduce((sum, l) => sum + l.product.unitPrice * l.quantity, 0);
    const trimmedCustomerName = customerName.trim() || null;
    const soldAt = new Date().toISOString();

    const saleId = await this.queue.enqueueSale({
      paymentMethod: this.paymentMethod(),
      paymentReference: paymentReference || null,
      customerName: trimmedCustomerName,
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

    this.activeReceipt.set({
      id: saleId,
      transactionNumber: `TXN-${datePart}-${String(sequence).padStart(4, '0')}`,
      customerName: trimmedCustomerName,
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
    });

    this.successMessage.set(`Sale recorded — ₱${total.toFixed(2)}. Syncing…`);
    this.clearCart();
    this.loadShiftSummary();
    this.loadRecentTransactions();
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
