import { Component, OnInit, signal } from '@angular/core';
import { ProductRequest, ProductsService, ProductSummary } from '../products';

@Component({
  selector: 'app-products',
  standalone: false,
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  readonly products = signal<ProductSummary[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly editingId = signal<number | null>(null);

  constructor(private productsService: ProductsService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  startEdit(product: ProductSummary): void {
    this.errorMessage.set(null);
    this.editingId.set(product.id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  createProduct(name: string, brandTag: string, unitPrice: string): void {
    const request = this.toRequest(name, brandTag, unitPrice);
    if (!request) {
      this.errorMessage.set('Enter a name and a valid price.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.productsService.create(request).subscribe({
      next: (product) => {
        this.submitting.set(false);
        this.products.update((products) => [product, ...products]);
        this.successMessage.set(`"${product.name}" added.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not add that product.');
      },
    });
  }

  saveEdit(product: ProductSummary, name: string, brandTag: string, unitPrice: string): void {
    const request = this.toRequest(name, brandTag, unitPrice);
    if (!request) {
      this.errorMessage.set('Enter a name and a valid price.');
      return;
    }

    this.errorMessage.set(null);
    this.productsService.update(product.id, request).subscribe({
      next: (updated) => {
        this.products.update((products) =>
          products.map((p) => (p.id === updated.id ? updated : p)),
        );
        this.editingId.set(null);
      },
      error: () => this.errorMessage.set('Could not update that product.'),
    });
  }

  toggleActive(product: ProductSummary): void {
    this.errorMessage.set(null);
    this.productsService.setActive(product.id, !product.active).subscribe({
      next: (updated) => {
        this.products.update((products) =>
          products.map((p) => (p.id === updated.id ? updated : p)),
        );
      },
      error: () => this.errorMessage.set('Could not update that product.'),
    });
  }

  private toRequest(name: string, brandTag: string, unitPrice: string): ProductRequest | null {
    const trimmedName = name.trim();
    const price = Number(unitPrice);
    if (!trimmedName || !Number.isFinite(price) || price < 0) {
      return null;
    }
    return { name: trimmedName, brandTag: brandTag.trim() || null, unitPrice: price };
  }

  private loadProducts(): void {
    this.productsService.adminList().subscribe({
      next: (products) => this.products.set(products),
      error: () => this.errorMessage.set('Could not load products.'),
    });
  }
}
