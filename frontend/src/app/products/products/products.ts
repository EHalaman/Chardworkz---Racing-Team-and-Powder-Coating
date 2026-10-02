import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
  effect,
  signal,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductDrafts } from '../product-drafts';
import { AuthService } from '../../core/auth';
import { PermissionFlag, PermissionsService } from '../../core/permissions';
import { PackageRequest, PackagesService, ServicePackage } from '../../register/packages';
import { ComboboxOption } from '../../shared/searchable-combobox/searchable-combobox';
import {
  BranchView,
  ProductCategory,
  ProductRequest,
  ProductsService,
  ProductSummary,
} from '../products';

type SortOption = 'DATE_NEWEST' | 'DATE_OLDEST' | 'PRICE_HIGH' | 'PRICE_LOW';
type FormMode = 'PRODUCT' | 'PACKAGE';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-products',
  standalone: false,
  styleUrl: './products.css',
  templateUrl: './products.html',
})
export class Products implements OnInit, OnDestroy {
  private readonly drafts = inject(ProductDrafts);

  readonly archived: boolean;

  readonly products = signal<ProductSummary[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly newCategory = this.drafts.productCategory;
  readonly newName = this.drafts.productName;
  readonly newBrandTag = this.drafts.productBrandTag;
  readonly newOemPartNo = this.drafts.productOemPartNo;
  readonly newUnitPrice = this.drafts.productUnitPrice;
  readonly editingCategory = signal<ProductCategory>('OTHERS');
  readonly categoryFilter = signal<ProductCategory | 'ALL'>('ALL');
  readonly branchView = signal<BranchView>('ALL');
  private loadSub?: Subscription;
  readonly branchViewOptions: { value: BranchView; label: string }[] = [
    { value: 'ALL', label: 'All branches' },
    { value: 'MAIN', label: 'Main' },
    { value: 'MASINAG', label: 'Masinag' },
  ];
  readonly searchTerm = signal('');
  readonly sortBy = signal<SortOption>('DATE_NEWEST');
  readonly currentPage = signal(1);
  readonly permissions = signal<PermissionFlag[]>([]);
  /** Highlights a just-created card for 2s (see createProduct) so it's easy
   * to spot in a list that's sorted/filtered, not just appended at the end. */
  readonly justCreatedId = signal<number | null>(null);

  /** DEC-085: "New product" panel toggle - Single Product (existing form, unchanged) vs Service Package (new builder below). */
  readonly formMode = this.drafts.formMode;
  readonly packages = signal<ServicePackage[]>([]);
  readonly packageSubmitting = signal(false);
  readonly packageErrorMessage = signal<string | null>(null);
  readonly packageLaborProductId = this.drafts.packageLaborProductId;
  /** productIds of physical parts checked into the package being built. */
  readonly packageSelectedParts = this.drafts.packageSelectedParts;
  /** Filters partOptions below the sticky search box - doesn't touch packageSelectedParts, so filtering never unchecks anything already picked. */
  readonly partsSearchTerm = this.drafts.partsSearchTerm;
  /** Non-null while editing an existing package (drawer pre-populated, submit calls PUT instead of POST) - see startEditPackage/cancelPackageEdit. */
  readonly editingPackageId = signal<number | null>(null);
  /** Snapshot of the package's name at the moment Edit was clicked - drives the "Edit Service Package: X" drawer title without shifting while the user retypes the name field. */
  readonly editingPackageName = signal<string | null>(null);
  readonly packageNameDraft = this.drafts.packageName;
  readonly packageDescriptionDraft = this.drafts.packageDescription;
  readonly packageBasePriceDraft = this.drafts.packageBasePrice;
  /** New-package form state parked while the Edit modal is open - see startEditPackage/cancelPackageEdit. */
  private createDraftSnapshot: {
    formMode: FormMode;
    name: string;
    description: string;
    basePrice: string;
    laborProductId: number | null;
    selectedParts: Set<number>;
    searchTerm: string;
  } | null = null;

  /** Auto-grows the description textarea to fit its content (Requirement 2) - re-runs whenever the element mounts or the draft it was prefilled with changes, so opening Edit on a long description doesn't leave it clipped until the user types. */
  private readonly packageDescriptionEls =
    viewChildren<ElementRef<HTMLTextAreaElement>>('packageDescription');

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
    private packagesService: PackagesService,
    private permissionsService: PermissionsService,
    readonly auth: AuthService,
    route: ActivatedRoute,
  ) {
    this.archived = route.snapshot.data['archived'] === true;

    effect(() => {
      // The New drawer and the Edit modal each have a #packageDescription textarea, so grow every one that is mounted.
      const els = this.packageDescriptionEls();
      const draft = this.packageDescriptionDraft();
      for (const { nativeElement: el } of els) {
        el.style.height = 'auto';
        el.style.height = `${Math.max(el.scrollHeight, 90)}px`;
      }
      void draft;
    });
  }

  /** Bound to the description textarea's (input) event so it keeps growing while the user types, not just on prefill. */
  autoGrowTextarea(target: EventTarget | null): void {
    const el = target as HTMLTextAreaElement | null;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 90)}px`;
  }

  ngOnDestroy(): void {
    // The Edit modal borrows the New-package draft signals; leaving mid-edit must restore the parked draft, not keep the edit as the "draft".
    // Skipped when signed out: the auth effect has already wiped the drafts, and restoring the snapshot would hand the old user's half-typed package to the next login.
    if (this.editingPackageId() !== null && this.auth.currentUser()) {
      this.cancelPackageEdit();
    }
    this.loadSub?.unsubscribe();
  }

  /** Mirrors a single-product text input into its draft signal so the typed text survives tab switches and navigation. */
  onProductDraftInput(
    field: 'name' | 'brandTag' | 'oemPartNo' | 'unitPrice',
    target: EventTarget | null,
  ): void {
    const input = target as HTMLInputElement | null;
    // A number input reports '' while the text is mid-edit and not yet valid (e.g. "1e"); writing that back via [value] would erase what was typed.
    if (input?.validity?.badInput) {
      return;
    }
    const value = input?.value ?? '';
    const draft = {
      name: this.newName,
      brandTag: this.newBrandTag,
      oemPartNo: this.newOemPartNo,
      unitPrice: this.newUnitPrice,
    }[field];
    draft.set(value);
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
    if (!this.archived) {
      this.packagesService.adminList().subscribe({
        next: (packages) => this.packages.set(packages),
        error: () => {
          // Non-fatal: plain product management must keep working even if this fetch fails.
        },
      });
    }
  }

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  /** Single master flag (migration V13) covering the whole catalog page for Manager - add, edit, delete, and deactivate/reactivate all gate on this one flag; Owner is always allowed. */
  get canManageProducts(): boolean {
    return (
      this.isOwner ||
      this.permissionsService.hasPermission(this.permissions(), 'MANAGER_MANAGE_PRODUCTS')
    );
  }

  /**
   * SERVICES-category products for the package builder's Labor dropdown -
   * the same single-labor-line convention DEC-084's two seed packages
   * already use. Also includes the currently-selected labor product even if
   * it's since been deactivated, so editing a package built around a now-
   * inactive service still shows/lets you change it instead of the
   * combobox silently blanking (flagged by /code-review).
   */
  get laborOptions(): ProductSummary[] {
    return this.products().filter(
      (p) => p.category === 'SERVICES' && (p.active || p.id === this.packageLaborProductId()),
    );
  }

  /**
   * Physical (non-SERVICES) products for the package builder's parts
   * multi-select. Also includes any already-checked part even if it's since
   * been deactivated, so editing a package containing a discontinued part
   * still shows its checkbox instead of hiding it entirely while it stays
   * silently selected (flagged by /code-review).
   */
  get partOptions(): ProductSummary[] {
    return this.products().filter(
      (p) => p.category !== 'SERVICES' && (p.active || this.packageSelectedParts().has(p.id)),
    );
  }

  /** partOptions narrowed by the sticky search box - filtering never touches packageSelectedParts, so an already-checked part stays checked even while it's filtered out of view. */
  get filteredPartOptions(): ProductSummary[] {
    const term = this.partsSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.partOptions;
    }
    return this.partOptions.filter(
      (p) =>
        p.name.toLowerCase().includes(term) || (p.oemPartNo ?? '').toLowerCase().includes(term),
    );
  }

  /** laborOptions reshaped for <app-searchable-combobox> (DEC-086) - replaces the native <select> that made typing to filter a long labor list impossible. */
  get laborComboboxOptions(): ComboboxOption[] {
    return this.laborOptions.map((labor) => ({
      id: labor.id,
      label: labor.name,
      sublabel: labor.active ? undefined : 'inactive',
      meta: `₱${labor.unitPrice.toFixed(2)}`,
    }));
  }

  togglePartSelection(productId: number): void {
    this.packageSelectedParts.update((selected) => {
      const next = new Set(selected);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  isPartSelected(productId: number): boolean {
    return this.packageSelectedParts().has(productId);
  }

  clearSelectedParts(): void {
    this.packageSelectedParts.set(new Set());
  }

  /** Selected parts reshaped for the removable-chip summary below the checklist (Requirement 3.4). */
  get selectedPartsList(): ProductSummary[] {
    return this.products().filter((p) => this.packageSelectedParts().has(p.id));
  }

  /** Sum of the labor line (if chosen) plus every selected part - the "Sum of parts" side of the savings calculator. */
  get packageComponentsSum(): number {
    const labor = this.products().find((p) => p.id === this.packageLaborProductId());
    const laborTotal = labor ? labor.unitPrice : 0;
    const partsTotal = this.products()
      .filter((p) => this.packageSelectedParts().has(p.id))
      .reduce((sum, p) => sum + p.unitPrice, 0);
    return laborTotal + partsTotal;
  }

  /** Prefills the same builder drawer used for Create - the drawer's own submit button calls submitPackage() either way, branching on editingPackageId(). */
  startEditPackage(pkg: ServicePackage): void {
    // Edit reuses the same draft signals as the New-package form, so park
    // whatever is in progress there and put it back when the modal closes.
    if (this.editingPackageId() === null) {
      this.createDraftSnapshot = {
        formMode: this.formMode(),
        name: this.packageNameDraft(),
        description: this.packageDescriptionDraft(),
        basePrice: this.packageBasePriceDraft(),
        laborProductId: this.packageLaborProductId(),
        selectedParts: new Set(this.packageSelectedParts()),
        searchTerm: this.partsSearchTerm(),
      };
    }
    this.formMode.set('PACKAGE');
    this.packageErrorMessage.set(null);
    this.editingPackageId.set(pkg.id);
    this.editingPackageName.set(pkg.name);
    this.packageNameDraft.set(pkg.name);
    this.packageDescriptionDraft.set(pkg.description ?? '');
    this.packageBasePriceDraft.set(pkg.basePrice !== null ? String(pkg.basePrice) : '');
    const labor = pkg.components.find((c) => c.required);
    this.packageLaborProductId.set(labor ? labor.productId : null);
    this.packageSelectedParts.set(
      new Set(pkg.components.filter((c) => !c.required).map((c) => c.productId)),
    );
    this.partsSearchTerm.set('');
  }

  /** Closes the Edit modal (restoring any New-package draft parked by startEditPackage), or resets the New form after a successful create. */
  cancelPackageEdit(): void {
    const snapshot = this.createDraftSnapshot;
    this.createDraftSnapshot = null;
    this.editingPackageId.set(null);
    this.editingPackageName.set(null);
    this.packageNameDraft.set(snapshot?.name ?? '');
    this.packageDescriptionDraft.set(snapshot?.description ?? '');
    this.packageBasePriceDraft.set(snapshot?.basePrice ?? '');
    this.packageLaborProductId.set(snapshot?.laborProductId ?? null);
    this.packageSelectedParts.set(snapshot?.selectedParts ?? new Set());
    this.partsSearchTerm.set(snapshot?.searchTerm ?? '');
    if (snapshot) {
      this.formMode.set(snapshot.formMode);
    }
    this.packageErrorMessage.set(null);
  }

  /**
   * Backdrop-only close. Kept as a void method rather than an inline `a && b && c()` template
   * expression: Angular treats a `false` handler result as preventDefault(), which cancelled
   * every checkbox toggle inside the modal as the click bubbled up to the backdrop.
   */
  onEditBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.packageSubmitting()) {
      this.cancelPackageEdit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editingPackageId() !== null && !this.packageSubmitting()) {
      this.cancelPackageEdit();
    }
  }

  /** Mirrors a text/number input into its draft signal so template reads (Bundle savings) and the New-draft snapshot see live values, not just the DOM. */
  onPackageDraftInput(field: 'name' | 'basePrice', target: EventTarget | null): void {
    const value = (target as HTMLInputElement | null)?.value ?? '';
    (field === 'name' ? this.packageNameDraft : this.packageBasePriceDraft).set(value);
  }

  onPackageDescriptionInput(target: EventTarget | null): void {
    this.packageDescriptionDraft.set((target as HTMLTextAreaElement | null)?.value ?? '');
    this.autoGrowTextarea(target);
  }

  submitPackage(name: string, description: string, basePrice: string): void {
    const trimmedName = name.trim();
    const components: PackageRequest['components'] = [];
    const laborId = this.packageLaborProductId();
    if (laborId !== null) {
      components.push({ productId: laborId, quantity: 1, required: true });
    }
    for (const productId of this.packageSelectedParts()) {
      components.push({ productId, quantity: 1, required: false });
    }

    if (!trimmedName || components.length === 0) {
      this.packageErrorMessage.set('Enter a name and pick at least one labor line or part.');
      return;
    }
    const trimmedBasePrice = basePrice.trim();
    const parsedBasePrice = trimmedBasePrice ? Number(trimmedBasePrice) : null;
    if (parsedBasePrice !== null && (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0)) {
      this.packageErrorMessage.set(
        'Base price must be a valid non-negative number, or left blank.',
      );
      return;
    }

    const request: PackageRequest = {
      name: trimmedName,
      description: description.trim() || null,
      basePrice: parsedBasePrice,
      components,
    };
    const editingId = this.editingPackageId();

    this.packageErrorMessage.set(null);
    this.packageSubmitting.set(true);
    const request$ =
      editingId !== null
        ? this.packagesService.update(editingId, request)
        : this.packagesService.create(request);
    request$.subscribe({
      next: (pkg) => {
        this.packageSubmitting.set(false);
        this.packages.update((packages) =>
          editingId !== null
            ? packages.map((p) => (p.id === pkg.id ? pkg : p))
            : [pkg, ...packages],
        );
        this.successMessage.set(
          editingId !== null ? `"${pkg.name}" updated.` : `"${pkg.name}" added.`,
        );
        setTimeout(() => this.successMessage.set(null), 3000);
        this.cancelPackageEdit();
      },
      error: () => {
        this.packageSubmitting.set(false);
        this.packageErrorMessage.set(
          editingId !== null ? 'Could not update that package.' : 'Could not add that package.',
        );
      },
    });
  }

  togglePackageActive(pkg: ServicePackage): void {
    this.packageErrorMessage.set(null);
    this.packagesService.setActive(pkg.id, !pkg.active).subscribe({
      next: (updated) =>
        this.packages.update((packages) =>
          packages.map((p) => (p.id === updated.id ? updated : p)),
        ),
      error: () => this.packageErrorMessage.set('Could not update that package.'),
    });
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
          p.name.toLowerCase().includes(term) ||
          (p.brandTag ?? '').toLowerCase().includes(term) ||
          (p.oemPartNo ?? '').toLowerCase().includes(term),
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

  /** Owner-only stock view: All = summed across branches. Reloads because the server computes each view's quantities. */
  setBranchView(view: BranchView): void {
    if (this.branchView() === view) {
      return;
    }
    this.branchView.set(view);
    this.loadProducts();
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

  createProduct(): void {
    const submitted = [
      this.newName(),
      this.newBrandTag(),
      this.newOemPartNo(),
      this.newUnitPrice(),
    ];
    const request = this.toRequest(
      submitted[0],
      submitted[1],
      submitted[2],
      submitted[3],
      this.newCategory(),
    );
    if (!request) {
      this.errorMessage.set('Enter a name and a valid price.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.productsService.create(request).subscribe({
      next: (product) => {
        this.submitting.set(false);
        // Only a successful add clears the draft - a failed add or a validation error keeps what was typed.
        // And only if it still holds what was submitted: the response can land after the user started a new draft.
        const unchanged =
          this.newName() === submitted[0] &&
          this.newBrandTag() === submitted[1] &&
          this.newOemPartNo() === submitted[2] &&
          this.newUnitPrice() === submitted[3];
        if (unchanged) {
          this.drafts.clearProduct();
        }
        this.products.update((products) => [product, ...products]);
        this.successMessage.set(`"${product.name}" added.`);
        setTimeout(() => this.successMessage.set(null), 3000);
        this.justCreatedId.set(product.id);
        setTimeout(() => this.justCreatedId.set(null), 2000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Could not add that product.');
      },
    });
  }

  saveEdit(
    product: ProductSummary,
    name: string,
    brandTag: string,
    oemPartNo: string,
    unitPrice: string,
  ): void {
    const request = this.toRequest(name, brandTag, oemPartNo, unitPrice, this.editingCategory());
    if (!request) {
      this.errorMessage.set('Enter a name and a valid price.');
      return;
    }

    this.errorMessage.set(null);
    this.productsService.update(product.id, request).subscribe({
      next: (updated) => {
        this.products.update((products) =>
          products.map((p) => (p.id === updated.id ? this.keepStock(p, updated) : p)),
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
        ? products.map((p) => (p.id === updated.id ? this.keepStock(p, updated) : p))
        : products.filter((p) => p.id !== updated.id),
    );
  }

  /** Write responses carry the caller's own-branch quantity, so keep the row's stock figure from the active branch view. */
  private keepStock(previous: ProductSummary, updated: ProductSummary): ProductSummary {
    return { ...updated, stockQuantity: previous.stockQuantity };
  }

  private toRequest(
    name: string,
    brandTag: string,
    oemPartNo: string,
    unitPrice: string,
    category: ProductCategory,
  ): ProductRequest | null {
    const trimmedName = name.trim();
    const price = Number(unitPrice);
    if (!trimmedName || !Number.isFinite(price) || price < 0) {
      return null;
    }
    return {
      name: trimmedName,
      brandTag: brandTag.trim() || null,
      oemPartNo: oemPartNo.trim() || null,
      unitPrice: price,
      category,
    };
  }

  private loadProducts(): void {
    // Only Owner gets the branch views; everyone else keeps their own branch's stock (server enforces this too).
    const branch = this.isOwner ? this.branchView() : undefined;
    const request = this.archived
      ? this.productsService.archivedList(branch)
      : this.productsService.adminList(branch);
    // Cancel any in-flight load so a slow earlier response (e.g. a previous branch tab) can't land last and overwrite this one.
    this.loadSub?.unsubscribe();
    this.loadSub = request.subscribe({
      next: (products) => this.products.set(products),
      error: () => this.errorMessage.set('Could not load products.'),
    });
  }
}
