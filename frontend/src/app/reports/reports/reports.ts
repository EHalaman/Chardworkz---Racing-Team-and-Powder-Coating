import { Component, ElementRef, HostListener, OnInit, ViewChild, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { downloadBlob } from '../../core/utils/download.util';
import { SaleReceipt, SalesService } from '../../register/sales';
import { CashierSummary, ReportsService, RecentSale, SalesReport } from '../reports';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-reports',
  standalone: false,
  styleUrl: './reports.css',
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  readonly report = signal<SalesReport | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly selectedBranch = signal<string | null>(null);

  readonly branchOptions = [
    { value: null, label: 'Both branches' },
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly searchTerm = signal('');

  /** Cashier combobox - same hand-rolled signal pattern as Inventory's product picker (no native <select>, no UI library). */
  readonly cashiers = signal<CashierSummary[]>([]);
  readonly cashierSearchTerm = signal('');
  readonly selectedCashierId = signal<number | null>(null);
  readonly isCashierDropdownOpen = signal(false);
  readonly highlightedCashierIndex = signal(0);

  /** Server-searched recent sales, populated once a search term or cashier filter is active; falls back to the report's own top-20 recentSales otherwise so the default view needs no extra round trip. */
  readonly searchResults = signal<RecentSale[] | null>(null);
  readonly searching = signal(false);

  readonly activeReceipt = signal<SaleReceipt | null>(null);
  readonly isReceiptClosing = signal(false);
  readonly receiptError = signal<string | null>(null);

  readonly exporting = signal(false);

  @ViewChild('cashierCombobox') private cashierComboboxWrapper?: ElementRef<HTMLElement>;
  private searchDebounceHandle?: ReturnType<typeof setTimeout>;

  constructor(
    private reportsService: ReportsService,
    private salesService: SalesService,
    readonly auth: AuthService,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  /** Mirrors Layout's/Inventory's own dropdown-close-on-outside-click. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.isCashierDropdownOpen() &&
      !this.cashierComboboxWrapper?.nativeElement.contains(target)
    ) {
      this.isCashierDropdownOpen.set(false);
    }
  }

  get cashierSearchResults(): CashierSummary[] {
    const term = this.cashierSearchTerm().trim().toLowerCase();
    if (!term) {
      return this.cashiers();
    }
    return this.cashiers().filter((c) => c.fullName.toLowerCase().includes(term));
  }

  onCashierSearchInput(value: string): void {
    this.cashierSearchTerm.set(value);
    this.highlightedCashierIndex.set(0);
    this.isCashierDropdownOpen.set(true);
    if (!value.trim()) {
      this.clearCashierFilter();
    }
  }

  openCashierDropdown(): void {
    this.isCashierDropdownOpen.set(true);
  }

  selectCashier(cashier: CashierSummary): void {
    this.selectedCashierId.set(cashier.id);
    this.cashierSearchTerm.set(cashier.fullName);
    this.isCashierDropdownOpen.set(false);
    this.runSearch();
  }

  clearCashierFilter(): void {
    this.selectedCashierId.set(null);
    this.cashierSearchTerm.set('');
    this.runSearch();
  }

  onCashierSearchKeydown(event: KeyboardEvent): void {
    const results = this.cashierSearchResults;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isCashierDropdownOpen.set(true);
      this.highlightedCashierIndex.update((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedCashierIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cashier = results[this.highlightedCashierIndex()];
      if (cashier) {
        this.selectCashier(cashier);
      }
    } else if (event.key === 'Escape') {
      this.isCashierDropdownOpen.set(false);
    }
  }

  get filteredRecentSales(): RecentSale[] {
    return this.searchResults() ?? this.report()?.recentSales ?? [];
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.runSearch(), SEARCH_DEBOUNCE_MS);
  }

  ngOnInit(): void {
    this.loadReport();
    this.loadCashiers();
  }

  selectBranch(branchCode: string | null): void {
    this.selectedBranch.set(branchCode);
    this.loadReport();
    this.runSearch();
  }

  applyDateRange(from: string, to: string): void {
    this.fromDate.set(from);
    this.toDate.set(to);
    this.loadReport();
    this.runSearch();
  }

  /** This page is already Owner/Manager-only via the route guard (see Layout.ALL_NAV_ITEMS) - no extra per-role check needed here for who can open a receipt. */
  openReceipt(saleId: string): void {
    this.receiptError.set(null);
    this.salesService.receipt(saleId).subscribe({
      next: (receipt) => {
        this.isReceiptClosing.set(false);
        this.activeReceipt.set(receipt);
      },
      error: () => this.receiptError.set('Could not load that transaction.'),
    });
  }

  /** Same delayed-unmount + close-then-reopen guard as Register's receipt modal (see register.ts) - keeps the pop-out animation from being cut short, and a stale close timeout from dismissing a receipt opened right after it. */
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

  /** Downloads the full, uncapped date/branch-filtered dataset as .xlsx - a binary blob response, not JSON, so it's triggered via a temporary object-URL anchor rather than routed through the app's normal HttpClient JSON flow. */
  exportToExcel(): void {
    this.exporting.set(true);
    this.reportsService
      .exportSales({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        branchCode: this.selectedBranch() ?? undefined,
      })
      .subscribe({
        next: (blob) => {
          this.exporting.set(false);
          downloadBlob(blob, 'chardworkz-sales-report.xlsx');
        },
        error: () => {
          this.exporting.set(false);
          this.errorMessage.set('Could not export the sales report.');
        },
      });
  }

  private loadReport(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.reportsService
      .salesReport({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        branchCode: this.selectedBranch() ?? undefined,
      })
      .subscribe({
        next: (report) => {
          this.loading.set(false);
          this.report.set(report);
          this.fromDate.set(report.from);
          this.toDate.set(report.to);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Could not load the sales report.');
        },
      });
  }

  /** No-op back to the plain report list once neither a search term nor a cashier filter is active - avoids an unnecessary round trip for the common "just browsing" case. */
  private runSearch(): void {
    const term = this.searchTerm().trim();
    const cashierId = this.selectedCashierId();
    if (!term && cashierId == null) {
      this.searchResults.set(null);
      return;
    }

    this.searching.set(true);
    this.reportsService
      .searchSales({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        branchCode: this.selectedBranch() ?? undefined,
        searchQuery: term || undefined,
        cashierId: cashierId ?? undefined,
      })
      .subscribe({
        next: (results) => {
          this.searching.set(false);
          this.searchResults.set(results);
        },
        error: () => {
          this.searching.set(false);
          this.errorMessage.set('Could not search recent sales.');
        },
      });
  }

  private loadCashiers(): void {
    this.reportsService.cashiers().subscribe({
      next: (cashiers) => this.cashiers.set(cashiers),
      error: () => {
        /* Non-critical: the cashier dropdown just renders empty. */
      },
    });
  }
}
