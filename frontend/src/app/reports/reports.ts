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
  transactionNumber: string;
  soldAt: string;
  branchCode: string;
  employeeId: number;
  employeeName: string;
  customerName: string | null;
  paymentMethod: string;
  paymentReference: string | null;
  total: number;
}

export interface CashierSummary {
  id: number;
  fullName: string;
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

export interface RecentSalesSearchQuery extends SalesReportQuery {
  searchQuery?: string;
  cashierId?: number;
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

  /** Backs the Recent Sales search/cashier filter - a separate call from {@link salesReport} so a search keystroke never re-fetches the aggregate cards. */
  searchSales(query: RecentSalesSearchQuery): Observable<RecentSale[]> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branchCode) params = params.set('branchCode', query.branchCode);
    if (query.searchQuery) params = params.set('searchQuery', query.searchQuery);
    if (query.cashierId) params = params.set('cashierId', String(query.cashierId));

    return this.http.get<RecentSale[]>(`${environment.apiBaseUrl}/api/reports/sales/search`, {
      params,
    });
  }

  cashiers(): Observable<CashierSummary[]> {
    return this.http.get<CashierSummary[]>(`${environment.apiBaseUrl}/api/reports/cashiers`);
  }

  /** Full, uncapped .xlsx of every sale in the selected range - a separate call from {@link salesReport}'s own capped recentSales list. */
  exportSales(query: SalesReportQuery): Observable<Blob> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.branchCode) params = params.set('branchCode', query.branchCode);

    return this.http.get(`${environment.apiBaseUrl}/api/reports/sales/export`, {
      params,
      responseType: 'blob',
    });
  }
}
