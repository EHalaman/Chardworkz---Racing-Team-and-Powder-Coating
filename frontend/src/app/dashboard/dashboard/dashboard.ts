import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin, catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth';
import {
  DashboardActivity,
  DashboardAlert,
  DashboardAnalytics,
  DashboardService,
  DashboardSummary,
  DashboardTimeRange,
  MarginStatus,
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

const EMPTY_ANALYTICS: DashboardAnalytics = {
  timeRange: 'MONTH',
  grossRevenue: 0,
  cogs: 0,
  grossProfit: 0,
  grossProfitMarginPercent: null,
  marginStatus: 'UNKNOWN',
  completedSalesCount: 0,
  averageOrderValue: 0,
  partsRevenue: 0,
  laborRevenue: 0,
  lineCountWithKnownCost: 0,
  lineCountTotal: 0,
  deadStockValue: 0,
  deadStockCount: 0,
  chartSeries: [],
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

  readonly analytics = signal<DashboardAnalytics>(EMPTY_ANALYTICS);
  readonly selectedTimeRange = signal<DashboardTimeRange>('MONTH');
  readonly timeRangeOptions: { value: DashboardTimeRange; label: string }[] = [
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'Week' },
    { value: 'MONTH', label: 'Month' },
    { value: 'YTD', label: 'YTD' },
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
  @ViewChild('analyticsChart') private analyticsChart?: BaseChartDirective;

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

  /**
   * COGS + Gross Profit stack to the same total (they sum to Gross Revenue
   * by definition); Gross Revenue is drawn as an unstacked overlay line so
   * its cap visually lines up with the top of each stacked bar. A mixed
   * chart type, so this is loosely typed rather than `ChartConfiguration<'bar'>`
   * (whose dataset type doesn't allow a per-dataset `type: 'line'` override).
   */
  readonly analyticsChartData: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
  readonly analyticsLegendItems = signal<{ label: string; color: string; hidden: boolean }[]>([]);
  readonly analyticsTooltip = signal<{
    x: number;
    y: number;
    label: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number | null;
  } | null>(null);

  readonly analyticsChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      // Custom HTML legend/tooltip below replace both of these.
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: (context) => this.handleAnalyticsTooltip(context),
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: '#9CA3AF',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          // Thin TODAY's hourly labels to every 2 hours so they don't
          // crowd - the underlying data stays hourly, only the label
          // is skipped, so hovering a "skipped" bar still shows exact
          // figures via the custom tooltip.
          callback: (_value, index) =>
            this.selectedTimeRange() === 'TODAY' && index % 2 !== 0
              ? ''
              : (this.analyticsChartData.labels?.[index] ?? ''),
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#9CA3AF' },
      },
    },
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
    this.loadAnalytics();
  }

  selectBranch(branchCode: string | null): void {
    this.selectedBranch.set(branchCode);
    this.loadDashboard();
    this.loadAnalytics();
  }

  selectTimeRange(timeRange: DashboardTimeRange): void {
    this.selectedTimeRange.set(timeRange);
    this.loadAnalytics();
  }

  marginBadgeClass(status: MarginStatus): string {
    switch (status) {
      case 'HEALTHY':
        return 'bg-secondary-light text-secondary dark:bg-secondary/20';
      case 'WARNING':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'AT_RISK':
        return 'bg-danger-light text-danger dark:bg-danger/20';
      default:
        return 'bg-nav-bg text-gray-500 dark:bg-slate-700 dark:text-gray-400';
    }
  }

  marginBadgeLabel(status: MarginStatus): string {
    switch (status) {
      case 'HEALTHY':
        return 'Healthy';
      case 'WARNING':
        return 'Warning';
      case 'AT_RISK':
        return 'At Risk';
      default:
        return 'N/M';
    }
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

  private loadAnalytics(): void {
    this.dashboardService
      .analytics(this.selectedTimeRange(), this.selectedBranch())
      .pipe(catchError(() => of(EMPTY_ANALYTICS)))
      .subscribe((analytics) => {
        this.analytics.set(analytics);
        this.applyAnalyticsToChart(analytics);
      });
  }

  private applyAnalyticsToChart(analytics: DashboardAnalytics): void {
    this.analyticsChartData.labels = analytics.chartSeries.map((p) => p.label);
    this.analyticsChartData.datasets = [
      {
        type: 'bar',
        data: analytics.chartSeries.map((p) => p.cogs),
        label: 'COGS',
        backgroundColor: '#E2B24A',
        stack: 'financials',
        borderRadius: 4,
      },
      {
        type: 'bar',
        data: analytics.chartSeries.map((p) => p.grossProfit),
        label: 'Gross Profit',
        backgroundColor: '#3FA485',
        stack: 'financials',
        borderRadius: 4,
      },
      {
        type: 'line',
        data: analytics.chartSeries.map((p) => p.revenue),
        label: 'Gross Revenue',
        borderColor: '#2563EB',
        backgroundColor: '#2563EB',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
      },
    ];
    this.analyticsLegendItems.set([
      { label: 'COGS', color: '#E2B24A', hidden: false },
      { label: 'Gross Profit', color: '#3FA485', hidden: false },
      { label: 'Gross Revenue', color: '#2563EB', hidden: false },
    ]);
    this.analyticsTooltip.set(null);
    this.analyticsChart?.update();
  }

  toggleAnalyticsLegendItem(index: number): void {
    const chart = this.analyticsChart?.chart;
    if (!chart) return;
    const nowVisible = !chart.isDatasetVisible(index);
    chart.setDatasetVisibility(index, nowVisible);
    chart.update();
    this.analyticsLegendItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, hidden: !nowVisible } : item)),
    );
  }

  private handleAnalyticsTooltip(context: { chart: any; tooltip: any }): void {
    const { tooltip } = context;
    if (tooltip.opacity === 0) {
      this.analyticsTooltip.set(null);
      return;
    }
    const index: number | undefined = tooltip.dataPoints?.[0]?.dataIndex;
    const point = index !== undefined ? this.analytics().chartSeries[index] : undefined;
    if (!point) {
      this.analyticsTooltip.set(null);
      return;
    }
    this.analyticsTooltip.set({
      x: tooltip.caretX,
      y: tooltip.caretY,
      label: point.label,
      revenue: point.revenue,
      cogs: point.cogs,
      grossProfit: point.grossProfit,
      marginPercent: point.revenue > 0 ? (point.grossProfit / point.revenue) * 100 : null,
    });
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
