import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TopProduct {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface MonthlyStockFlow {
  month: string;
  stockIn: number;
  stockOut: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  monthSalesGoal: number;
  salesGoalPercent: number;
  topProducts: TopProduct[];
  stockFlow: MonthlyStockFlow[];
}

export interface DashboardAlert {
  type: 'OUT_OF_STOCK' | 'LOW_STOCK';
  title: string;
  message: string;
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

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiBaseUrl}/api/dashboard/summary`);
  }

  alerts(): Observable<DashboardAlert[]> {
    return this.http.get<DashboardAlert[]>(`${environment.apiBaseUrl}/api/dashboard/alerts`);
  }

  activity(limit?: number): Observable<DashboardActivity[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit);
    return this.http.get<DashboardActivity[]>(`${environment.apiBaseUrl}/api/dashboard/activity`, {
      params,
    });
  }
}
