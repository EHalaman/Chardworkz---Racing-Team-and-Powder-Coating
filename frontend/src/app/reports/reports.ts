import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  count: number;
  revenue: number;
}

export interface BranchBreakdown {
  branchCode: string;
  count: number;
  revenue: number;
}

export interface TopProduct {
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface RecentSale {
  id: string;
  soldAt: string;
  branchCode: string;
  employeeName: string;
  paymentMethod: string;
  total: number;
}

export interface SalesReport {
  from: string;
  to: string;
  totalSales: number;
  totalRevenue: number;
  byPaymentMethod: PaymentMethodBreakdown[];
  byBranch: BranchBreakdown[];
  topProducts: TopProduct[];
  recentSales: RecentSale[];
}

export interface SalesReportQuery {
  from?: string;
  to?: string;
  branchCode?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  salesReport(query: SalesReportQuery): Observable<SalesReport> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branchCode) params = params.set('branchCode', query.branchCode);

    return this.http.get<SalesReport>(`${environment.apiBaseUrl}/api/reports/sales`, { params });
  }
}
