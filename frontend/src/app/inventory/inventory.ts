import { HttpClient } from '@angular/common/http';
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

  list(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${environment.apiBaseUrl}/api/inventory`);
  }

  receipts(): Observable<StockReceipt[]> {
    return this.http.get<StockReceipt[]>(`${environment.apiBaseUrl}/api/inventory/receipts`);
  }

  receive(request: ReceiveStockRequest): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(
      `${environment.apiBaseUrl}/api/inventory/receive`,
      request,
    );
  }

  updateReorderThreshold(productId: number, reorderThreshold: number): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(
      `${environment.apiBaseUrl}/api/inventory/${productId}/reorder-threshold`,
      { reorderThreshold },
    );
  }
}
