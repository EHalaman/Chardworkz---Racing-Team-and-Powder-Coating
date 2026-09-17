import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  alerts(branchCode?: string | null): Observable<DashboardAlert[]> {
    let params = new HttpParams();
    if (branchCode) params = params.set('branchCode', branchCode);
    return this.http.get<DashboardAlert[]>(`${environment.apiBaseUrl}/api/dashboard/alerts`, {
      params,
    });
  }

  activity(limit?: number, branchCode?: string | null): Observable<DashboardActivity[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit);
    if (branchCode) params = params.set('branchCode', branchCode);
    return this.http.get<DashboardActivity[]>(`${environment.apiBaseUrl}/api/dashboard/activity`, {
      params,
    });
  }
}
