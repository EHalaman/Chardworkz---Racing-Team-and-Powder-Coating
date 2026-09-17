import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth';
import {
  DashboardActivity,
  DashboardAlert,
  DashboardService,
  DashboardSummary,
  TopProduct,
} from '../dashboard';

interface FeedItem {
  icon: 'sale' | 'receipt';
  color: 'primary' | 'secondary';
  title: string;
  subtitle: string;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalProducts: 0,
  totalStockValue: 0,
  totalStockValueAtCost: 0,
  lowStockCount: 0,
  monthSalesCount: 0,
  monthSalesTotal: 0,
  monthSalesGoal: 0,
  salesGoalPercent: 0,
  averageOrderValue: 0,
  partsRevenue: 0,
  laborRevenue: 0,
  estimatedCostTotal: 0,
  estimatedMarginTotal: 0,
  estimatedMarginPercent: null,
  lineCountWithKnownCost: 0,
  lineCountTotal: 0,
  paymentMethodBreakdown: [],
  topMarginParts: [],
  topWorkshopServices: [],
  stockFlow: [],
};

/** Real data throughout, wired to /api/dashboard/*. Each stream falls back
 * to an empty/zeroed value on error rather than failing the whole page -
 * one flaky endpoint shouldn't blank the entire Dashboard. */
@Component({
  selector: 'app-dashboard',
  standalone: false,
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly summary = signal<DashboardSummary>(EMPTY_SUMMARY);
  readonly loadError = signal<string | null>(null);
  readonly alerts = signal<DashboardAlert[]>([]);
  readonly topProductsTab = signal<'PARTS' | 'SERVICES'>('PARTS');

  readonly selectedBranch = signal<string | null>(null);
  readonly branchOptions = [
    { value: null, label: 'Both branches' },
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  /**
   * `BaseChartDirective` only redraws on `ngOnChanges`, which needs a new
   * `data` object reference - mutating `barChartData.labels`/`.datasets` in
   * place (below) is invisible to it. Without this, whether the chart ever
   * shows real data purely depended on whether the summary HTTP response
   * resolved before or after the directive's first paint - a race a slow
   * phone loses far more often than a warm desktop dev session.
   */
  @ViewChild('barChart') private barChart?: BaseChartDirective;
  @ViewChild('doughnutChart') private doughnutChart?: BaseChartDirective;

  readonly recentActivities = signal<FeedItem[]>([]);

  readonly barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9CA3AF' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.15)' }, ticks: { color: '#9CA3AF' } },
    },
  };

  readonly doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Achieved', 'Remaining'],
    datasets: [{ data: [0, 100], backgroundColor: ['#3FA485', '#E5E7EB'], borderWidth: 0 }],
  };
  readonly doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  constructor(
    private dashboardService: DashboardService,
    readonly auth: AuthService,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  get topProducts(): TopProduct[] {
    return this.topProductsTab() === 'PARTS'
      ? this.summary().topMarginParts
      : this.summary().topWorkshopServices;
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  selectBranch(branchCode: string | null): void {
    this.selectedBranch.set(branchCode);
    this.loadDashboard();
  }

  topProductInitial(product: TopProduct): string {
    return product.productName.charAt(0);
  }

  reorderQueryParams(alert: DashboardAlert): Record<string, string | number> {
    return { restock: alert.productId, qty: alert.suggestedReorderQty };
  }

  private loadDashboard(): void {
    const branchCode = this.selectedBranch();
    forkJoin({
      summary: this.dashboardService.summary(branchCode).pipe(catchError(() => of(EMPTY_SUMMARY))),
      alerts: this.dashboardService
        .alerts(branchCode)
        .pipe(catchError(() => of<DashboardAlert[]>([]))),
      activity: this.dashboardService
        .activity(5, branchCode)
        .pipe(catchError(() => of<DashboardActivity[]>([]))),
    }).subscribe(({ summary, alerts, activity }) => {
      this.summary.set(summary);
      this.applySummaryToCharts(summary);
      this.alerts.set(alerts);
      this.recentActivities.set(activity.map((item) => this.toActivityFeedItem(item)));
    });
  }

  private applySummaryToCharts(summary: DashboardSummary): void {
    this.barChartData.labels = summary.stockFlow.map((f) => f.month);
    this.barChartData.datasets = [
      {
        data: summary.stockFlow.map((f) => f.stockIn),
        label: 'Stock In',
        backgroundColor: '#3FA485',
        borderRadius: 4,
      },
      {
        data: summary.stockFlow.map((f) => f.stockOut),
        label: 'Stock Out',
        backgroundColor: '#E2B24A',
        borderRadius: 4,
      },
    ];

    const achieved = Math.max(0, Math.min(100, summary.salesGoalPercent));
    this.doughnutChartData.datasets[0].data = [achieved, 100 - achieved];

    this.barChart?.update();
    this.doughnutChart?.update();
  }

  private toActivityFeedItem(activity: DashboardActivity): FeedItem {
    return {
      icon: activity.type === 'SALE' ? 'sale' : 'receipt',
      color: activity.type === 'SALE' ? 'primary' : 'secondary',
      title: activity.title,
      subtitle: activity.subtitle,
    };
  }
}
