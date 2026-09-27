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
  delivererName: string | null;
  delivererContact: string | null;
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
  totalCost: number;
  supplierName: string;
  referenceNo: string | null;
  receivedAt: string;
  receivedById: number;
  receivedByName: string;
  delivererName: string | null;
  delivererContact: string | null;
}

export interface ReceiptFilter {
  from: string | null;
  to: string | null;
  searchQuery: string | null;
  receiverId: number | null;
}

export interface ReceiverSummary {
  id: number;
  fullName: string;
}

export interface InventoryImportRowResult {
  rowNumber: number;
  productId: number | null;
  productName: string;
  currentQuantity: number | null;
  newQuantity: number | null;
  currentReorderThreshold: number | null;
  newReorderThreshold: number | null;
  valid: boolean;
  created: boolean;
  reason: string | null;
}

export interface InventoryImportPreview {
  rows: InventoryImportRowResult[];
  validCount: number;
  invalidCount: number;
}

export interface InventoryImportCommitResult {
  updatedCount: number;
  createdCount: number;
  skippedCount: number;
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

  receipts(branchCode?: string | null, filter?: ReceiptFilter): Observable<StockReceipt[]> {
    let params = this.branchParams(branchCode);
    if (filter?.from) params = params.set('from', filter.from);
    if (filter?.to) params = params.set('to', filter.to);
    if (filter?.searchQuery) params = params.set('searchQuery', filter.searchQuery);
    if (filter?.receiverId) params = params.set('receiverId', filter.receiverId);
    return this.http.get<StockReceipt[]>(`${environment.apiBaseUrl}/api/inventory/receipts`, {
      params,
    });
  }

  /** Owner-view receiver filter dropdown for Recent Receipts. */
  receivers(): Observable<ReceiverSummary[]> {
    return this.http.get<ReceiverSummary[]>(`${environment.apiBaseUrl}/api/inventory/receivers`);
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

  /** Same single-branch scope as {@link list} - Inventory has no merged "both branches" view. */
  exportInventory(branchCode?: string | null): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/api/inventory/export`, {
      params: this.branchParams(branchCode),
      responseType: 'blob',
    });
  }

  /** Validates every row without writing anything - the caller must confirm via {@link commitImport}. */
  previewImport(file: File, branchCode?: string | null): Observable<InventoryImportPreview> {
    const formData = new FormData();
    formData.set('file', file);
    return this.http.post<InventoryImportPreview>(
      `${environment.apiBaseUrl}/api/inventory/import/preview`,
      formData,
      { params: this.branchParams(branchCode) },
    );
  }

  /** Re-sends the same file - the backend re-validates deterministically and applies only rows that pass. */
  commitImport(file: File, branchCode?: string | null): Observable<InventoryImportCommitResult> {
    const formData = new FormData();
    formData.set('file', file);
    return this.http.post<InventoryImportCommitResult>(
      `${environment.apiBaseUrl}/api/inventory/import/commit`,
      formData,
      { params: this.branchParams(branchCode) },
    );
  }

  private branchParams(branchCode?: string | null): HttpParams {
    let params = new HttpParams();
    if (branchCode) params = params.set('branchCode', branchCode);
    return params;
  }
}
