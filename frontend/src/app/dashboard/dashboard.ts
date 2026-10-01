import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

type BranchKey = string | null;

function branchKey(branchCode: BranchKey): string {
  return branchCode ?? 'ALL';
}

export interface TopProduct {
  productName: string;
  quantitySold: number;
  revenue: number;
  estimatedMargin: number | null;
}

export interface MonthlyStockFlow {
  month: string;
  stockIn: number;
  stockOut: number;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  count: number;
  revenue: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalStockValue: number;
  totalStockValueAtCost: number;
  lowStockCount: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  monthSalesGoal: number;
  salesGoalPercent: number;
  averageOrderValue: number;
  partsRevenue: number;
  laborRevenue: number;
  estimatedCostTotal: number;
  estimatedMarginTotal: number;
  estimatedMarginPercent: number | null;
  lineCountWithKnownCost: number;
  lineCountTotal: number;
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  topMarginParts: TopProduct[];
  topWorkshopServices: TopProduct[];
  stockFlow: MonthlyStockFlow[];
}

export interface DashboardAlert {
  type: 'OUT_OF_STOCK' | 'LOW_STOCK';
  productId: number;
  productName: string;
  branchCode: string;
  quantity: number;
  reorderThreshold: number;
  suggestedReorderQty: number;
}

export interface DashboardActivity {
  type: 'SALE' | 'RECEIPT';
  title: string;
  subtitle: string;
  occurredAt: string;
}

export type DashboardTimeRange = 'TODAY' | 'WEEK' | 'MONTH' | 'YTD';

export type MarginStatus = 'HEALTHY' | 'WARNING' | 'AT_RISK' | 'UNKNOWN';

export interface ChartPoint {
  label: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
}

export interface DashboardAnalytics {
  timeRange: DashboardTimeRange;
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  grossProfitMarginPercent: number | null;
  marginStatus: MarginStatus;
  completedSalesCount: number;
  averageOrderValue: number;
  partsRevenue: number;
  laborRevenue: number;
  lineCountWithKnownCost: number;
  lineCountTotal: number;
  deadStockValue: number;
  deadStockCount: number;
  chartSeries: ChartPoint[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  summary(branchCode?: string | null): Observable<DashboardSummary> {
    let params = new HttpParams();
    if (branchCode) params = params.set('branchCode', branchCode);
    return this.http.get<DashboardSummary>(`${environment.apiBaseUrl}/api/dashboard/summary`, {
      params,
    });
  }

  /** Layout's alert bell and the Dashboard page both ask for alerts on every load - share one in-flight request per branch instead of sending two identical ones. */
  private readonly alertsInFlight = new Map<string, Observable<DashboardAlert[]>>();

  alerts(branchCode?: string | null): Observable<DashboardAlert[]> {
    const key = branchCode ?? '';
    const inFlight = this.alertsInFlight.get(key);
    if (inFlight) return inFlight;

    let params = new HttpParams();
    if (branchCode) params = params.set('branchCode', branchCode);
    const request = this.http
      .get<DashboardAlert[]>(`${environment.apiBaseUrl}/api/dashboard/alerts`, { params })
      .pipe(
        finalize(() => this.alertsInFlight.delete(key)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.alertsInFlight.set(key, request);
    return request;
  }

  activity(limit?: number, branchCode?: string | null): Observable<DashboardActivity[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit);
    if (branchCode) params = params.set('branchCode', branchCode);
    return this.http.get<DashboardActivity[]>(`${environment.apiBaseUrl}/api/dashboard/activity`, {
      params,
    });
  }

  analytics(
    timeRange: DashboardTimeRange,
    branchCode?: string | null,
  ): Observable<DashboardAnalytics> {
    let params = new HttpParams().set('timeRange', timeRange);
    if (branchCode) params = params.set('branchCode', branchCode);
    return this.http.get<DashboardAnalytics>(`${environment.apiBaseUrl}/api/dashboard/analytics`, {
      params,
    });
  }
}

/**
 * In-memory, singleton-service-backed cache for the Dashboard screen -
 * keyed by branch (and, for analytics, time range too) - so navigating away
 * and back shows the last-known data immediately instead of the harsh
 * "0 products"/"₱0.00" flash of a fresh {@link Dashboard} component re-init.
 * Not a full NgRx-style store (this app doesn't use one elsewhere): plain
 * Maps are enough since only the Dashboard component itself reads this.
 * The component still always fires a background refetch on every visit
 * (stale-while-revalidate) - this only changes what's shown *while* that
 * fetch is in flight, never skips it.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly summaryByBranch = new Map<string, DashboardSummary>();
  private readonly alertsByBranch = new Map<string, DashboardAlert[]>();
  private readonly activityByBranch = new Map<string, DashboardActivity[]>();
  private readonly analyticsByKey = new Map<string, DashboardAnalytics>();

  getSummary(branchCode: BranchKey): DashboardSummary | null {
    return this.summaryByBranch.get(branchKey(branchCode)) ?? null;
  }

  setSummary(branchCode: BranchKey, value: DashboardSummary): void {
    this.summaryByBranch.set(branchKey(branchCode), value);
  }

  getAlerts(branchCode: BranchKey): DashboardAlert[] | null {
    return this.alertsByBranch.get(branchKey(branchCode)) ?? null;
  }

  setAlerts(branchCode: BranchKey, value: DashboardAlert[]): void {
    this.alertsByBranch.set(branchKey(branchCode), value);
  }

  getActivity(branchCode: BranchKey): DashboardActivity[] | null {
    return this.activityByBranch.get(branchKey(branchCode)) ?? null;
  }

  setActivity(branchCode: BranchKey, value: DashboardActivity[]): void {
    this.activityByBranch.set(branchKey(branchCode), value);
  }

  getAnalytics(branchCode: BranchKey, timeRange: DashboardTimeRange): DashboardAnalytics | null {
    return this.analyticsByKey.get(`${branchKey(branchCode)}:${timeRange}`) ?? null;
  }

  setAnalytics(
    branchCode: BranchKey,
    timeRange: DashboardTimeRange,
    value: DashboardAnalytics,
  ): void {
    this.analyticsByKey.set(`${branchKey(branchCode)}:${timeRange}`, value);
  }
}
