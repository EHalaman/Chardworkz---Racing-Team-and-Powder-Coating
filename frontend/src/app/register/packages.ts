import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductCategory } from '../products/products';

export interface PackageComponent {
  productId: number;
  productName: string;
  category: ProductCategory;
  unitPrice: number;
  defaultQuantity: number;
  required: boolean;
}

export interface ServicePackage {
  id: number;
  name: string;
  description: string | null;
  /** Admin-set discounted bundle price (DEC-085) - null means "price at the live sum of components" (the original DEC-084 behavior). */
  basePrice: number | null;
  defaultTotal: number;
  active: boolean;
  components: PackageComponent[];
}

export interface PackageComponentRequest {
  productId: number;
  quantity: number;
  required: boolean;
}

export interface PackageRequest {
  name: string;
  description: string | null;
  basePrice: number | null;
  components: PackageComponentRequest[];
}

/**
 * DEC-084: the two seed packages are deliberately dummy/placeholder data
 * (`V24__add_service_package_bundling.sql`) - the business owner confirmed
 * the real component makeup isn't known yet. DEC-085 added real create/
 * status-toggle endpoints so Owner/Manager can build real packages from
 * Products going forward, alongside those placeholder ones.
 */
@Injectable({ providedIn: 'root' })
export class PackagesService {
  constructor(private http: HttpClient) {}

  list(): Observable<ServicePackage[]> {
    return this.http.get<ServicePackage[]>(`${environment.apiBaseUrl}/api/packages`);
  }

  adminList(): Observable<ServicePackage[]> {
    return this.http.get<ServicePackage[]>(`${environment.apiBaseUrl}/api/packages/admin`);
  }

  create(request: PackageRequest): Observable<ServicePackage> {
    return this.http.post<ServicePackage>(`${environment.apiBaseUrl}/api/packages`, request);
  }

  /** Replaces a package's definition for future Register selections only - never touches an already-completed sale's snapshotted line data (see PackageController.update). */
  update(id: number, request: PackageRequest): Observable<ServicePackage> {
    return this.http.put<ServicePackage>(`${environment.apiBaseUrl}/api/packages/${id}`, request);
  }

  setActive(id: number, active: boolean): Observable<ServicePackage> {
    return this.http.patch<ServicePackage>(`${environment.apiBaseUrl}/api/packages/${id}/status`, {
      active,
    });
  }
}
