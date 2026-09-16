import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProductCategory = 'CARB' | 'FI' | 'OTHERS' | 'SERVICES';

export interface ProductSummary {
  id: number;
  name: string;
  brandTag: string | null;
  unitPrice: number;
  category: ProductCategory;
  stockQuantity: number;
  active: boolean;
}

export interface ProductRequest {
  name: string;
  brandTag: string | null;
  unitPrice: number;
  category: ProductCategory;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  list(): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${environment.apiBaseUrl}/api/products`);
  }

  adminList(): Observable<ProductSummary[]> {
    return this.http.get<ProductSummary[]>(`${environment.apiBaseUrl}/api/products/admin`);
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
}
