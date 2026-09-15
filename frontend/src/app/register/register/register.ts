import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { OfflineSaleQueueService } from '../../offline-sales/offline-sale-queue';
import { ProductsService, ProductSummary } from '../../products/products';

interface CartLine {
  product: ProductSummary;
  quantity: number;
}

type PaymentMethod = 'CASH' | 'GCASH' | 'EWALLET_OTHER';

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

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'GCASH', label: 'GCash' },
    { value: 'EWALLET_OTHER', label: 'Other e-wallet' },
  ];

  constructor(
    private productsService: ProductsService,
    private queue: OfflineSaleQueueService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.productsService.list().subscribe({
      next: (products) => this.products.set(products),
      // Client-side search below still works against whatever loaded before
      // a connectivity drop - only the initial fetch can fail like this.
      error: () => this.loadError.set('Could not load products. Check your connection and reload.'),
    });
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

  async completeSale(paymentReference: string): Promise<void> {
    const lines = this.cart();
    if (lines.length === 0) {
      return;
    }

    const total = lines.reduce((sum, l) => sum + l.product.unitPrice * l.quantity, 0);

    await this.queue.enqueueSale({
      paymentMethod: this.paymentMethod(),
      paymentReference: paymentReference || null,
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

    this.successMessage.set(`Sale recorded — ₱${total.toFixed(2)}. Syncing…`);
    this.clearCart();
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
