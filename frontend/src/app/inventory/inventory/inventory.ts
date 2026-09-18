import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth';
import {
  BranchInventorySummary,
  InventoryImportPreview,
  InventoryItem,
  InventoryService,
  StockReceipt,
} from '../inventory';

type StockFilter = 'ALL' | 'low-stock' | 'out-of-stock';
type StockSortOption = 'DEFAULT' | 'QTY_LOW' | 'QTY_HIGH';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-inventory',
  standalone: false,
  styleUrl: './inventory.css',
  templateUrl: './inventory.html',
})
export class Inventory implements OnInit, OnDestroy {
  readonly items = signal<InventoryItem[]>([]);
  readonly receipts = signal<StockReceipt[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly editingThresholdFor = signal<number | null>(null);
  readonly selectedBranch = signal<string | null>(null);
  readonly branchSummaries = signal<BranchInventorySummary[]>([]);
  readonly searchTerm = signal('');
  readonly stockFilter = signal<StockFilter>('ALL');
  readonly restockProductId = signal('');
  readonly restockQty = signal('');
  readonly sortBy = signal<StockSortOption>('DEFAULT');
  readonly currentPage = signal(1);

  readonly exporting = signal(false);
  readonly isImportModalOpen = signal(false);
  readonly selectedImportFile = signal<File | null>(null);
  readonly importPreview = signal<InventoryImportPreview | null>(null);
  readonly isPreviewLoading = signal(false);
  readonly isCommitting = signal(false);
  readonly importError = signal<string | null>(null);

  readonly sortOptions: { value: StockSortOption; label: string }[] = [
    { value: 'DEFAULT', label: 'Default order' },
    { value: 'QTY_LOW', label: 'Stock quantity (Low to High)' },
    { value: 'QTY_HIGH', label: 'Stock quantity (High to Low)' },
  ];

  /** Receive Stock's product combobox - a plain signal pair instead of a template-ref select, since a hand-rolled dropdown owns its own rendering and doesn't need the [value]-on-a-native-<select> ViewChild/setTimeout workaround the old picker required (see git history: that hack existed only because Angular's dirty-check skips reapplying a bound value when the underlying <option> list changes shape without the value itself changing). */
  readonly productSearchTerm = signal('');
  readonly selectedProductId = signal('');
  readonly isProductDropdownOpen = signal(false);
  readonly highlightedProductIndex = signal(0);

  @ViewChild('productCombobox') private productComboboxWrapper?: ElementRef<HTMLElement>;

  private queryParamsSub?: Subscription;

  readonly branchOptions = [
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  constructor(
    private inventoryService: InventoryService,
    readonly auth: AuthService,
    private route: ActivatedRoute,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  /** Mirrors Layout's own dropdown-close-on-outside-click - same reasoning: this isn't a native <select>/<details>, so nothing closes it by default. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.isProductDropdownOpen() &&
      !this.productComboboxWrapper?.nativeElement.contains(target)
    ) {
      this.isProductDropdownOpen.set(false);
    }
  }

  get productSearchResults(): InventoryItem[] {
    const term = this.productSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.items();
    }
    return this.items().filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.brandTag ?? '').toLowerCase().includes(term),
    );
  }

  onProductSearchInput(value: string): void {
    this.productSearchTerm.set(value);
    this.selectedProductId.set('');
    this.highlightedProductIndex.set(0);
    this.isProductDropdownOpen.set(true);
  }

  openProductDropdown(): void {
    this.isProductDropdownOpen.set(true);
  }

  selectProduct(item: InventoryItem): void {
    this.selectedProductId.set(String(item.productId));
    this.productSearchTerm.set(item.brandTag ? `${item.name} · ${item.brandTag}` : item.name);
    this.isProductDropdownOpen.set(false);
  }

  onProductSearchKeydown(event: KeyboardEvent): void {
    const results = this.productSearchResults;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isProductDropdownOpen.set(true);
      this.highlightedProductIndex.update((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedProductIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[this.highlightedProductIndex()];
      if (item) {
        this.selectProduct(item);
      }
    } else if (event.key === 'Escape') {
      this.isProductDropdownOpen.set(false);
    }
  }

  get filteredItems(): InventoryItem[] {
    const term = this.searchTerm().trim().toLowerCase();
    const filter = this.stockFilter();
    const list = this.items()
      .filter(
        (item) =>
          !term ||
          item.name.toLowerCase().includes(term) ||
          (item.brandTag ?? '').toLowerCase().includes(term),
      )
      .filter((item) => {
        if (filter === 'out-of-stock') return item.quantity === 0;
        if (filter === 'low-stock') return item.lowStock;
        return true;
      });

    const sort = this.sortBy();
    if (sort === 'DEFAULT') {
      return list;
    }
    return [...list].sort((a, b) =>
      sort === 'QTY_LOW' ? a.quantity - b.quantity : b.quantity - a.quantity,
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedItems(): InventoryItem[] {
    const page = Math.min(this.currentPage(), this.totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredItems.slice(start, start + PAGE_SIZE);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  setSortBy(sort: StockSortOption): void {
    this.sortBy.set(sort);
    this.currentPage.set(1);
  }

  /** The filter itself stays route-driven (see ngOnInit) - this only overrides the local signal so "clear" doesn't require a navigation, matching how every other filter/search control on this page already behaves. */
  clearStockFilter(): void {
    this.stockFilter.set('ALL');
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.selectedBranch.set(this.auth.currentUser()?.branchCode ?? 'MAIN');
    // Reactive, not a one-time snapshot read: the same component instance is
    // reused when only the query string changes (e.g. reusing an already-open
    // Inventory tab for a different alert, or navigating back to the plain
    // /inventory link) - a constructor-only read would leave a stale filter
    // showing after the query param it came from is gone.
    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      this.stockFilter.set((params.get('filter') as StockFilter | null) ?? 'ALL');
      this.restockProductId.set(params.get('restock') ?? '');
      this.restockQty.set(params.get('qty') ?? '');
      this.currentPage.set(1);
      this.applyRestockSelection();
    });
    this.loadInventory();
    this.loadReceipts();
    if (this.isOwner) {
      this.loadBranchSummaries();
    }
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  selectBranch(branchCode: string): void {
    this.selectedBranch.set(branchCode);
    this.editingThresholdFor.set(null);
    this.loadInventory();
    this.loadReceipts();
  }

  summaryFor(branchCode: string): BranchInventorySummary | undefined {
    return this.branchSummaries().find((summary) => summary.branchCode === branchCode);
  }

  /** Downloads the current branch's inventory as .xlsx - same blob/anchor pattern as Sales Reports' export. */
  exportInventory(): void {
    this.exporting.set(true);
    this.inventoryService.exportInventory(this.selectedBranch()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `chardworkz-inventory-${this.selectedBranch()}.xlsx`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting.set(false);
        this.errorMessage.set('Could not export inventory.');
      },
    });
  }

  openImportModal(): void {
    this.selectedImportFile.set(null);
    this.importPreview.set(null);
    this.importError.set(null);
    this.isImportModalOpen.set(true);
  }

  closeImportModal(): void {
    this.isImportModalOpen.set(false);
  }

  onImportFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedImportFile.set(file);
    this.importPreview.set(null);
    this.importError.set(null);
    if (file) {
      this.previewImportFile(file);
    }
  }

  private previewImportFile(file: File): void {
    this.isPreviewLoading.set(true);
    this.importError.set(null);
    this.inventoryService.previewImport(file, this.selectedBranch()).subscribe({
      next: (preview) => {
        this.isPreviewLoading.set(false);
        this.importPreview.set(preview);
      },
      error: (err) => {
        this.isPreviewLoading.set(false);
        this.importError.set(
          err?.error?.message ??
            'Could not read that file. Use the file from "Export Inventory" and edit that.',
        );
      },
    });
  }

  /** Re-sends the same file to /import/commit - the backend re-validates deterministically and applies only the rows already shown as valid in the preview. */
  confirmImport(): void {
    const file = this.selectedImportFile();
    if (!file) {
      return;
    }
    this.isCommitting.set(true);
    this.inventoryService.commitImport(file, this.selectedBranch()).subscribe({
      next: (result) => {
        this.isCommitting.set(false);
        this.isImportModalOpen.set(false);
        this.successMessage.set(
          `Import complete — ${result.updatedCount} product(s) updated` +
            (result.skippedCount > 0 ? `, ${result.skippedCount} row(s) skipped.` : '.'),
        );
        this.loadInventory();
        if (this.isOwner) {
          this.loadBranchSummaries();
        }
      },
      error: (err) => {
        this.isCommitting.set(false);
        this.importError.set(err?.error?.message ?? 'Could not commit the import.');
      },
    });
  }

  startEditThreshold(item: InventoryItem): void {
    this.errorMessage.set(null);
    this.editingThresholdFor.set(item.productId);
  }

  cancelEditThreshold(): void {
    this.editingThresholdFor.set(null);
  }

  saveThreshold(item: InventoryItem, value: string): void {
    const threshold = Number(value);
    if (!Number.isFinite(threshold) || threshold < 0) {
      this.errorMessage.set('Reorder threshold must be a non-negative number.');
      return;
    }

    this.errorMessage.set(null);
    this.inventoryService
      .updateReorderThreshold(item.productId, threshold, this.selectedBranch())
      .subscribe({
        next: (updated) => {
          this.items.update((items) =>
            items.map((i) => (i.productId === updated.productId ? updated : i)),
          );
          this.editingThresholdFor.set(null);
          if (this.isOwner) {
            this.loadBranchSummaries();
          }
        },
        error: () => this.errorMessage.set('Could not update the reorder threshold.'),
      });
  }

  receiveStock(
    quantity: string,
    unitCost: string,
    supplierName: string,
    referenceNo: string,
  ): void {
    const parsedProductId = Number(this.selectedProductId());
    const parsedQuantity = Number(quantity);
    const parsedUnitCost = Number(unitCost);
    if (!parsedProductId) {
      this.errorMessage.set('Pick a product.');
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      this.errorMessage.set('Enter a quantity of at least 1.');
      return;
    }
    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      this.errorMessage.set('Enter a valid unit cost.');
      return;
    }
    if (!supplierName.trim()) {
      this.errorMessage.set('Enter a supplier name.');
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    this.inventoryService
      .receive({
        productId: parsedProductId,
        quantity: parsedQuantity,
        unitCost: parsedUnitCost,
        supplierName: supplierName.trim(),
        referenceNo: referenceNo.trim() || null,
        branchCode: this.selectedBranch(),
      })
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.items.update((items) =>
            items.map((i) => (i.productId === updated.productId ? updated : i)),
          );
          this.successMessage.set(`Received ${parsedQuantity} × "${updated.name}".`);
          setTimeout(() => this.successMessage.set(null), 3000);
          this.selectedProductId.set('');
          this.productSearchTerm.set('');
          this.loadReceipts();
          if (this.isOwner) {
            this.loadBranchSummaries();
          }
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Could not record that stock receipt.');
        },
      });
  }

  /**
   * Preselects the combobox for the Archived Products "Restock" quick-action
   * link (?restock=<id>). Safe to call from either direction (items or
   * restockProductId changing) since it's a no-op without a pending id or a
   * loaded matching item yet - unlike the native-<select> version this
   * replaced, a plain signal set() doesn't need a deferred tick or a
   * ViewChild, since this combobox's own template renders straight off
   * these signals rather than relying on the DOM's <option> matching.
   */
  private applyRestockSelection(): void {
    const id = this.restockProductId();
    if (!id) {
      return;
    }
    const item = this.items().find((i) => String(i.productId) === id);
    if (item) {
      this.selectProduct(item);
    }
  }

  private loadInventory(): void {
    this.inventoryService.list(this.selectedBranch()).subscribe({
      next: (items) => {
        this.items.set(items);
        this.applyRestockSelection();
      },
      error: () => this.errorMessage.set('Could not load inventory.'),
    });
  }

  private loadReceipts(): void {
    this.inventoryService.receipts(this.selectedBranch()).subscribe({
      next: (receipts) => this.receipts.set(receipts),
      error: () => this.errorMessage.set('Could not load recent receipts.'),
    });
  }

  private loadBranchSummaries(): void {
    this.inventoryService.branchSummary().subscribe({
      next: (summaries) => this.branchSummaries.set(summaries),
      error: () => {
        /* Non-critical: the branch buttons just render without count badges. */
      },
    });
  }
}
