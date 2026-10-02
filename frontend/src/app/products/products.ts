import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProductCategory = 'CARB' | 'FI' | 'OTHERS' | 'SERVICES';
/** Owner-only stock view on the Products page: ALL sums every branch. */
export type BranchView = 'ALL' | 'MAIN' | 'MASINAG';

export interface ProductSummary {
  id: number;
  name: string;
  brandTag: string | null;
  oemPartNo: string | null;
  unitPrice: number;
  category: ProductCategory;
  stockQuantity: number;
  active: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export interface ProductRequest {
  name: string;
  brandTag: string | null;
  oemPartNo: string | null;
  unitPrice: number;
  category: ProductCategory;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  list(): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${environment.apiBaseUrl}/api/products`);
  }

  /** branch (Owner only; ignored server-side for anyone else): ALL sums every branch, otherwise a branch code. Omitted = caller own branch. */
  adminList(branch?: string): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${environment.apiBaseUrl}/api/products/admin`, {
      params: branch ? { branch } : {},
    });
  }

  archivedList(branch?: string): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${environment.apiBaseUrl}/api/products/archived`, {
      params: branch ? { branch } : {},
    });
  }

  create(request: ProductRequest): Observable<ProductSummary> {
    return this.http.post<ProductSummary>(`${environment.apiBaseUrl}/api/products`, request);
  }

  update(id: number, request: ProductRequest): Observable<ProductSummary> {
    return this.http.patch<ProductSummary>(`${environment.apiBaseUrl}/api/products/${id}`, request);
  }

  setActive(id: number, active: boolean): Observable<ProductSummary> {
    return this.http.patch<ProductSummary>(`${environment.apiBaseUrl}/api/products/${id}/status`, {
      active,
    });
  }

  delete(id: number): Observable<ProductSummary> {
    return this.http.delete<ProductSummary>(`${environment.apiBaseUrl}/api/products/${id}`);
  }
}
