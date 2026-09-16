import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { ALL_NAV_ITEMS, HIDDEN_GUARDED_ROUTES, Role } from '../layout/layout/layout';
import { AuthService } from './auth';

/**
 * Nav filtering (Layout.navItems) already hides items per role, but that's
 * cosmetic only - this is the actual enforcement for a direct URL hit (e.g. a
 * Manager typing /roles). Reuses ALL_NAV_ITEMS as the single source of truth
 * for which roles may reach which path, rather than a second role list here.
 * HIDDEN_GUARDED_ROUTES covers drill-through routes (e.g. /activities) that
 * are reachable via a link rather than the dock rail - without checking it
 * too, a route absent from ALL_NAV_ITEMS would be open to every role by
 * default instead of denied.
 */
export const roleGuard: CanActivateChildFn = (_childRoute, state) => {
  const auth = inject(AuthService);
  const role = auth.currentUser()?.role.toLowerCase() as Role | undefined;
  if (!role) {
    // authGuard (on the same route tree) handles the logged-out case; this
    // is just a defensive fallback if it's ever reached without a session.
    return inject(Router).createUrlTree(['/login']);
  }

  const guarded =
    ALL_NAV_ITEMS.find((item) => item.path === state.url) ??
    HIDDEN_GUARDED_ROUTES.find((item) => item.path === state.url);
  if (!guarded || guarded.roles.includes(role)) {
    return true;
  }

  // Same "where does this role actually land" logic as Login's post-login
  // redirect - Employee has no Dashboard access.
  return inject(Router).createUrlTree([role === 'employee' ? '/register' : '/dashboard']);
};
