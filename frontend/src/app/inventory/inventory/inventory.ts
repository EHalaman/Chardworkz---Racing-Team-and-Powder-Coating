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
import { DeepLinkReplay, highlightElement, whenElementReady } from '../../core/deep-link';
import { downloadBlob } from '../../core/utils/download.util';
import {
  BranchInventorySummary,
  InventoryImportPreview,
  InventoryItem,
  InventoryService,
  InventoryStore,
  ReceiverSummary,
  StockReceipt,
} from '../inventory';

type StockFilter = 'ALL' | 'low-stock' | 'out-of-stock';
type StockSortOption = 'DEFAULT' | 'QTY_LOW' | 'QTY_HIGH';

const PAGE_SIZE = 10;
const RECEIPT_SEARCH_DEBOUNCE_MS = 300;

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

  readonly receiptSearchTerm = signal('');
  readonly receiptFrom = signal('');
  readonly receiptTo = signal('');
  readonly receiptReceiverId = signal<number | null>(null);
  readonly receiptCurrentPage = signal(1);
  readonly receivers = signal<ReceiverSummary[]>([]);
  readonly selectedReceipt = signal<StockReceipt | null>(null);
  private receiptSearchDebounceHandle?: ReturnType<typeof setTimeout>;

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
  /** Deep-link state from ?highlight= / ?restock= - applied once the matching item has loaded, then cleared. */
  private pendingHighlightId = '';
  private pendingFormPulse = false;
  private paramsInitialised = false;
  private lastHighlightId = '';
  private lastHadRestock = false;
  private lastBranch = '';
  private replaySub?: Subscription;

  readonly branchOptions = [
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  constructor(
    private inventoryService: InventoryService,
    private inventoryStore: InventoryStore,
    readonly auth: AuthService,
    private route: ActivatedRoute,
    private deepLinkReplay: DeepLinkReplay,
  ) {}

  /** Keeps a row's DOM element across a refresh (cached list, then fresh response) so a deep-link highlight class on it isn't wiped. */
  trackByProductId(_index: number, item: InventoryItem): number {
    return item.productId;
  }

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

  get totalReceiptPages(): number {
    return Math.max(1, Math.ceil(this.receipts().length / PAGE_SIZE));
  }

  get receiptPageNumbers(): number[] {
    return Array.from({ length: this.totalReceiptPages }, (_, i) => i + 1);
  }

  get pagedReceipts(): StockReceipt[] {
    const page = Math.min(this.receiptCurrentPage(), this.totalReceiptPages);
    const start = (page - 1) * PAGE_SIZE;
    return this.receipts().slice(start, start + PAGE_SIZE);
  }

  goToReceiptPage(page: number): void {
    this.receiptCurrentPage.set(page);
  }

  onReceiptSearchInput(value: string): void {
    this.receiptSearchTerm.set(value);
    clearTimeout(this.receiptSearchDebounceHandle);
    this.receiptSearchDebounceHandle = setTimeout(() => {
      this.receiptCurrentPage.set(1);
      this.loadReceipts();
    }, RECEIPT_SEARCH_DEBOUNCE_MS);
  }

  applyReceiptDateRange(from: string, to: string): void {
    this.receiptFrom.set(from);
    this.receiptTo.set(to);
    this.receiptCurrentPage.set(1);
    this.loadReceipts();
  }

  selectReceiptReceiver(receiverId: string): void {
    this.receiptReceiverId.set(receiverId ? Number(receiverId) : null);
    this.receiptCurrentPage.set(1);
    this.loadReceipts();
  }

  openReceiptDetail(receipt: StockReceipt): void {
    this.selectedReceipt.set(receipt);
  }

  closeReceiptDetail(): void {
    this.selectedReceipt.set(null);
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

      // ?branch= opens that branch's tab - Owner only, since every other role is bound to their own branch.
      const branch = params.get('branch');
      const branchChanged =
        this.isOwner &&
        branch !== null &&
        branch !== this.selectedBranch() &&
        this.branchOptions.some((option) => option.value === branch);
      if (branchChanged) {
        this.selectedBranch.set(branch);
        this.editingThresholdFor.set(null);
        this.receiptCurrentPage.set(1);
      }
      this.pendingHighlightId = params.get('highlight') ?? '';
      this.pendingFormPulse = !!params.get('restock');
      this.lastHighlightId = this.pendingHighlightId;
      this.lastHadRestock = this.pendingFormPulse;
      this.lastBranch = branch ?? '';

      // The first emission is followed by ngOnInit's own loads; later ones (same instance, new query string) must reload on a branch change.
      const reloading = this.paramsInitialised && branchChanged;
      if (reloading) {
        this.loadInventory();
        this.loadReceipts();
      }
      this.paramsInitialised = true;
      // After a branch switch the rows on screen are still the old branch's until its data arrives, so let loadInventory apply the
      // restock selection and highlight against the new branch's items instead of consuming them here against stale rows.
      if (!reloading) {
        this.applyRestockSelection();
        this.applyPendingHighlight();
      }
    });
    this.replaySub = this.deepLinkReplay.replay$.subscribe(() => {
      this.pendingHighlightId = this.lastHighlightId;
      this.pendingFormPulse = this.lastHadRestock;
      // The user may have switched branch tabs since the alert was opened (that doesn't change the URL), so go back to the alert's branch.
      if (
        this.isOwner &&
        this.lastBranch &&
        this.lastBranch !== this.selectedBranch() &&
        this.branchOptions.some((option) => option.value === this.lastBranch)
      ) {
        this.selectBranch(this.lastBranch);
        return;
      }
      this.applyRestockSelection();
      this.applyPendingHighlight();
    });
    this.loadInventory();
    this.loadReceipts();
    if (this.isOwner) {
      this.loadBranchSummaries();
      this.loadReceivers();
    }
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
    this.replaySub?.unsubscribe();
  }

  selectBranch(branchCode: string): void {
    this.selectedBranch.set(branchCode);
    this.editingThresholdFor.set(null);
    this.receiptCurrentPage.set(1);
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
        downloadBlob(blob, `chardworkz-inventory-${this.selectedBranch()}.xlsx`);
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
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Reset so picking the exact same file again still fires a 'change' event
    // (the browser otherwise treats an unchanged input value as a no-op).
    input.value = '';
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
            (result.createdCount > 0 ? `, ${result.createdCount} product(s) created` : '') +
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
    delivererName: string,
    delivererContact: string,
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
        delivererName: delivererName.trim() || null,
        delivererContact: delivererContact.trim() || null,
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
      if (this.pendingFormPulse) {
        this.pendingFormPulse = false;
        whenElementReady('inv-receive-panel', (el) => highlightElement(el, 'pulse'));
      }
    }
  }

  /**
   * ?highlight=<productId>: jump to the page the item is on, scroll its row to the top and blink it. Safe to call whenever
   * items change - it does nothing until the matching item has loaded for the selected branch, then clears itself. If a search
   * or stock filter is hiding the item, those are reset so the target is actually visible.
   */
  private applyPendingHighlight(): void {
    const id = this.pendingHighlightId;
    if (!id) {
      return;
    }
    const indexOf = () => this.filteredItems.findIndex((item) => String(item.productId) === id);
    let index = indexOf();
    if (index === -1 && this.items().some((item) => String(item.productId) === id)) {
      this.searchTerm.set('');
      this.stockFilter.set('ALL');
      index = indexOf();
    }
    if (index === -1) {
      return;
    }
    this.pendingHighlightId = '';
    this.currentPage.set(Math.floor(index / PAGE_SIZE) + 1);
    whenElementReady(`inv-row-${id}`, (el) => highlightElement(el, 'blink'));
  }

  private loadInventory(): void {
    const branchCode = this.selectedBranch();

    // Stale-while-revalidate, same pattern as DashboardStore: a previously-
    // visited branch's list shows immediately while the fetch below
    // refreshes it, instead of an empty table flash.
    const cached = this.inventoryStore.get(branchCode);
    if (cached) {
      this.items.set(cached);
      this.applyRestockSelection();
      this.applyPendingHighlight();
    }

    this.inventoryService.list(branchCode).subscribe({
      next: (items) => {
        this.items.set(items);
        this.applyRestockSelection();
        this.applyPendingHighlight();
        this.inventoryStore.set(branchCode, items);
      },
      error: () => this.errorMessage.set('Could not load inventory.'),
    });
  }

  private loadReceipts(): void {
    this.inventoryService
      .receipts(this.selectedBranch(), {
        from: this.receiptFrom() || null,
        to: this.receiptTo() || null,
        searchQuery: this.receiptSearchTerm().trim() || null,
        receiverId: this.receiptReceiverId(),
      })
      .subscribe({
        next: (receipts) => this.receipts.set(receipts),
        error: () => this.errorMessage.set('Could not load recent receipts.'),
      });
  }

  private loadReceivers(): void {
    this.inventoryService.receivers().subscribe({
      next: (receivers) => this.receivers.set(receivers),
      error: () => {
        /* Non-critical: the receiver filter dropdown just stays empty. */
      },
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
