import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { SaleReceipt, SalesService } from '../../register/sales';
import { ReportsService, RecentSale, SalesReport } from '../reports';

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

  readonly activeReceipt = signal<SaleReceipt | null>(null);
  readonly isReceiptClosing = signal(false);
  readonly receiptError = signal<string | null>(null);

  constructor(
    private reportsService: ReportsService,
    private salesService: SalesService,
    readonly auth: AuthService,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  get filteredRecentSales(): RecentSale[] {
    const term = this.searchTerm().trim().toLowerCase();
    const sales = this.report()?.recentSales ?? [];
    if (!term) {
      return sales;
    }
    return sales.filter(
      (sale) =>
        sale.id.toLowerCase().includes(term) ||
        sale.employeeName.toLowerCase().includes(term) ||
        (sale.paymentReference ?? '').toLowerCase().includes(term),
    );
  }

  ngOnInit(): void {
    this.loadReport();
  }

  selectBranch(branchCode: string | null): void {
    this.selectedBranch.set(branchCode);
    this.loadReport();
  }

  applyDateRange(from: string, to: string): void {
    this.fromDate.set(from);
    this.toDate.set(to);
    this.loadReport();
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
}
