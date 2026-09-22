import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type PermissionKey = 'MANAGER_MANAGE_PRODUCTS';

export interface PermissionFlag {
  permissionKey: PermissionKey;
  enabled: boolean;
}

/** Owner+Manager can read (a Manager needs to know their own current permissions); only Owner can change them. */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private permissions$?: Observable<PermissionFlag[]>;

  constructor(private http: HttpClient) {}

  /**
   * Shared across every caller within a session (Layout, the products
   * route guard, and Products/Settings each used to fire their own request
   * on the same page load) - the underlying HTTP GET only happens once per
   * cache lifetime, everyone else gets the replayed result.
   */
  list(): Observable<PermissionFlag[]> {
    if (!this.permissions$) {
      this.permissions$ = this.http
        .get<PermissionFlag[]>(`${environment.apiBaseUrl}/api/permissions`)
        .pipe(tap({ error: () => (this.permissions$ = undefined) }), shareReplay(1));
    }
    return this.permissions$;
  }

  update(key: PermissionKey, enabled: boolean): Observable<PermissionFlag> {
    return this.http
      .patch<PermissionFlag>(`${environment.apiBaseUrl}/api/permissions/${key}`, { enabled })
      .pipe(tap(() => (this.permissions$ = undefined)));
  }

  /**
   * Called by AuthService on login/logout - this app is a shared counter
   * station (SPA navigation, no page reload between users), so without this
   * a Manager's cached flags could otherwise leak into the next person who
   * logs in on the same tab.
   */
  clear(): void {
    this.permissions$ = undefined;
  }

  /** Single "find by key, fail closed on missing/not-yet-loaded" lookup - was copy-pasted across layout.ts, products.ts, settings.ts, and products-permission-guard.ts. */
  hasPermission(flags: PermissionFlag[], key: PermissionKey): boolean {
    return flags.find((f) => f.permissionKey === key)?.enabled ?? false;
  }
}
