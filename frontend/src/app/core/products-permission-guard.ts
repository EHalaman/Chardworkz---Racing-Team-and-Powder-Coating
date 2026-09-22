import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth';
import { PermissionsService } from './permissions';

/**
 * role-guard.ts already enforces that only Owner/Manager reach /admin/products
 * at all - this is the extra, permission-level gate on top of that: a Manager
 * whose MANAGER_MANAGE_PRODUCTS flag is off gets redirected to /admin/dashboard
 * even though their role alone would otherwise be allowed in. Owner is
 * always allowed, same as every other MANAGER_MANAGE_PRODUCTS check.
 * Fails closed on a load error, matching this app's existing convention for
 * this flag (Layout's own nav-hiding, Products' own button-hiding).
 */
export const productsPermissionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  if (auth.currentUser()?.role !== 'MANAGER') {
    return true;
  }

  return permissionsService.list().pipe(
    map((permissions) => {
      const enabled = permissionsService.hasPermission(permissions, 'MANAGER_MANAGE_PRODUCTS');
      return enabled ? true : router.createUrlTree(['/admin/dashboard']);
    }),
    catchError(() => of(router.createUrlTree(['/admin/dashboard']))),
  );
};
