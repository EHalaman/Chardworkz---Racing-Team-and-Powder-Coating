import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductCategory } from '../products/products';

export interface ReceiptLine {
  productName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleReceipt {
  id: string;
  transactionNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  branchName: string;
  employeeName: string;
  soldAt: string;
  paymentMethod: string;
  paymentReference: string | null;
  subtotal: number;
  total: number;
  lines: ReceiptLine[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private http: HttpClient) {}

  today(): Observable<SaleReceipt[]> {
    return this.http.get<SaleReceipt[]>(`${environment.apiBaseUrl}/api/sales/today`);
  }

  /** Backs Sales Reports' clickable recent-sales cards (Manager/Owner) - unlike today(), not limited to the caller's own branch/day. */
  receipt(saleId: string): Observable<SaleReceipt> {
    return this.http.get<SaleReceipt>(`${environment.apiBaseUrl}/api/reports/sales/${saleId}`);
  }
}
