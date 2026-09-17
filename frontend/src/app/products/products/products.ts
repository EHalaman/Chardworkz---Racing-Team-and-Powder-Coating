import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth';
import { PermissionFlag, PermissionsService } from '../../core/permissions';
import { ProductCategory, ProductRequest, ProductsService, ProductSummary } from '../products';

type SortOption = 'DATE_NEWEST' | 'DATE_OLDEST' | 'PRICE_HIGH' | 'PRICE_LOW';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-products',
  standalone: false,
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit {
  readonly archived: boolean;

  readonly products = signal<ProductSummary[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly newCategory = signal<ProductCategory>('OTHERS');
  readonly editingCategory = signal<ProductCategory>('OTHERS');
  readonly categoryFilter = signal<ProductCategory | 'ALL'>('ALL');
  readonly searchTerm = signal('');
  readonly sortBy = signal<SortOption>('DATE_NEWEST');
  readonly currentPage = signal(1);
  readonly permissions = signal<PermissionFlag[]>([]);

  readonly categoryOptions: { value: ProductCategory; label: string }[] = [
    { value: 'CARB', label: 'Carb' },
    { value: 'FI', label: 'FI' },
    { value: 'OTHERS', label: 'Others' },
    { value: 'SERVICES', label: 'Services' },
  ];

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'DATE_NEWEST', label: 'Date added (Newest)' },
    { value: 'DATE_OLDEST', label: 'Date added (Oldest)' },
    { value: 'PRICE_HIGH', label: 'Price (High to Low)' },
    { value: 'PRICE_LOW', label: 'Price (Low to High)' },
  ];

  constructor(
    private productsService: ProductsService,
    private permissionsService: PermissionsService,
    readonly auth: AuthService,
    route: ActivatedRoute,
  ) {
    this.archived = route.snapshot.data['archived'] === true;
  }

  ngOnInit(): void {
    this.loadProducts();
    this.permissionsService.list().subscribe({
      next: (permissions) => this.permissions.set(permissions),
      error: () => {
        // Owner never needs these to act (always allowed); a Manager who fails
        // to load them just sees Edit/Delete stay hidden, the same as if they
        // were disabled - fails closed, not open.
      },
    });
  }

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  get canEdit(): boolean {
    return this.isOwner || this.isPermissionEnabled('MANAGER_EDIT_PRODUCTS');
  }

  get canDelete(): boolean {
    return this.isOwner || this.isPermissionEnabled('MANAGER_DELETE_PRODUCTS');
  }

  private isPermissionEnabled(key: string): boolean {
    return this.permissions().find((p) => p.permissionKey === key)?.enabled ?? false;
  }

  get filteredProducts(): ProductSummary[] {
    const category = this.categoryFilter();
    const term = this.searchTerm().trim().toLowerCase();

    let list = this.products();
    // Main catalog: just active - a zero-stock physical product stays here
    // with an "Out of stock" badge instead of disappearing into Archived,
    // which otherwise swallowed every brand-new product before its first
    // stock receipt (nothing's been received for it yet). Archived is
    // reserved for an explicit Deactivate/Delete now (see DEC-047).
    if (!this.archived) {
      list = list.filter((p) => p.active);
    }
    if (category !== 'ALL') {
      list = list.filter((p) => p.category === category);
    }
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) || (p.brandTag ?? '').toLowerCase().includes(term),
      );
    }

    const sort = this.sortBy();
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'DATE_OLDEST':
          return a.createdAt.localeCompare(b.createdAt);
        case 'PRICE_HIGH':
          return b.unitPrice - a.unitPrice;
        case 'PRICE_LOW':
          return a.unitPrice - b.unitPrice;
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedProducts(): ProductSummary[] {
    const page = Math.min(this.currentPage(), this.totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredProducts.slice(start, start + PAGE_SIZE);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setCategoryFilter(category: ProductCategory | 'ALL'): void {
    this.categoryFilter.set(category);
    this.currentPage.set(1);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  setSortBy(sort: SortOption): void {
    this.sortBy.set(sort);
    this.currentPage.set(1);
  }

  startEdit(product: ProductSummary): void {
    this.errorMessage.set(null);
    this.editingCategory.set(product.category);
    this.editingId.set(product.id);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  createProduct(name: string, brandTag: string, unitPrice: string): void {
    const request = this.toRequest(name, brandTag, unitPrice, this.newCategory());
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
    const request = this.toRequest(name, brandTag, unitPrice, this.editingCategory());
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
      next: (updated) => this.applyUpdate(product, updated),
      error: () => this.errorMessage.set('Could not update that product.'),
    });
  }

  deleteProduct(product: ProductSummary): void {
    this.errorMessage.set(null);
    this.productsService.delete(product.id).subscribe({
      next: (updated) => {
        this.applyUpdate(product, updated);
        this.successMessage.set(`"${product.name}" deleted.`);
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => this.errorMessage.set('Could not delete that product.'),
    });
  }

  reactivate(product: ProductSummary): void {
    this.errorMessage.set(null);
    this.productsService.setActive(product.id, true).subscribe({
      next: (updated) => this.applyUpdate(product, updated),
      error: () => this.errorMessage.set('Could not reactivate that product.'),
    });
  }

  /** In the main view a Deactivate/Delete/Reactivate removes the row locally if it now belongs on the other page, instead of a full refetch. */
  private applyUpdate(original: ProductSummary, updated: ProductSummary): void {
    const belongsHere = this.archived ? !updated.active : updated.active;

    this.products.update((products) =>
      belongsHere
        ? products.map((p) => (p.id === updated.id ? updated : p))
        : products.filter((p) => p.id !== updated.id),
    );
  }

  private toRequest(
    name: string,
    brandTag: string,
    unitPrice: string,
    category: ProductCategory,
  ): ProductRequest | null {
    const trimmedName = name.trim();
    const price = Number(unitPrice);
    if (!trimmedName || !Number.isFinite(price) || price < 0) {
      return null;
    }
    return { name: trimmedName, brandTag: brandTag.trim() || null, unitPrice: price, category };
  }

  private loadProducts(): void {
    const request = this.archived
      ? this.productsService.archivedList()
      : this.productsService.adminList();
    request.subscribe({
      next: (products) => this.products.set(products),
      error: () => this.errorMessage.set('Could not load products.'),
    });
  }
}
