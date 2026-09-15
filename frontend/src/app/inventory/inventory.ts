import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InventoryItem {
  productId: number;
  name: string;
  brandTag: string | null;
  quantity: number;
  reorderThreshold: number;
  lowStock: boolean;
}

export interface ReceiveStockRequest {
  productId: number;
  quantity: number;
  unitCost: number;
  supplierName: string;
  referenceNo: string | null;
  branchCode: string | null;
}

export interface BranchInventorySummary {
  branchCode: string;
  inStockCount: number;
  lowStockCount: number;
}

export interface StockReceipt {
  id: number;
  productName: string;
  quantity: number;
  unitCost: number;
  supplierName: string;
  referenceNo: string | null;
  receivedAt: string;
  receivedByName: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private http: HttpClient) {}

  list(branchCode?: string | null): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${environment.apiBaseUrl}/api/inventory`, {
      params: this.branchParams(branchCode),
    });
  }

  branchSummary(): Observable<BranchInventorySummary[]> {
    return this.http.get<BranchInventorySummary[]>(
      `${environment.apiBaseUrl}/api/inventory/branch-summary`,
    );
  }

  receipts(branchCode?: string | null): Observable<StockReceipt[]> {
    return this.http.get<StockReceipt[]>(`${environment.apiBaseUrl}/api/inventory/receipts`, {
      params: this.branchParams(branchCode),
    });
  }

  receive(request: ReceiveStockRequest): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(
      `${environment.apiBaseUrl}/api/inventory/receive`,
      request,
    );
  }

  updateReorderThreshold(
    productId: number,
    reorderThreshold: number,
    branchCode?: string | null,
  ): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(
      `${environment.apiBaseUrl}/api/inventory/${productId}/reorder-threshold`,
      { reorderThreshold, branchCode: branchCode ?? null },
    );
  }

  private branchParams(branchCode?: string | null): HttpParams {
    let params = new HttpParams();
    if (branchCode) params = params.set('branchCode', branchCode);
    return params;
  }
}
