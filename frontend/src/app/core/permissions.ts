import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PermissionKey = 'MANAGER_EDIT_PRODUCTS' | 'MANAGER_DELETE_PRODUCTS';

export interface PermissionFlag {
  permissionKey: PermissionKey;
  enabled: boolean;
}

/** Owner+Manager can read (a Manager needs to know their own current permissions); only Owner can change them. */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  constructor(private http: HttpClient) {}

  list(): Observable<PermissionFlag[]> {
    return this.http.get<PermissionFlag[]>(`${environment.apiBaseUrl}/api/permissions`);
  }

  update(key: PermissionKey, enabled: boolean): Observable<PermissionFlag> {
    return this.http.patch<PermissionFlag>(`${environment.apiBaseUrl}/api/permissions/${key}`, {
      enabled,
    });
  }
}
