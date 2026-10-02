import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, catchError, filter, of } from 'rxjs';
import { AuthService } from '../../core/auth';
import { DeepLinkReplay } from '../../core/deep-link';
import { PermissionFlag, PermissionKey, PermissionsService } from '../../core/permissions';
import { SalesEventsService } from '../../core/sales-events';
import { ThemeService } from '../../core/theme';
import { DashboardAlert, DashboardService } from '../../dashboard/dashboard';

export type Role = 'owner' | 'manager' | 'employee';

export interface NavItem {
  label: string;
  path: string;
  icon:
    | 'dashboard'
    | 'register'
    | 'products'
    | 'inventory'
    | 'reports'
    | 'roles'
    | 'settings'
    | 'activity-log';
  roles: Role[];
  /** Only relevant to the 'manager' role - Owner is always allowed regardless. Gates the item behind this flag, same convention as MANAGER_MANAGE_PRODUCTS. */
  requiredPermission?: PermissionKey;
}

export interface Tab {
  /** Pathname only (no query string) - the tab's identity, so filter/query variants of the same route reuse one tab instead of spawning a new one. */
  path: string;
  queryParams: Record<string, string>;
  title: string;
}

// Exported so core/role-guard.ts can enforce the exact same per-route roles
// at the router level instead of duplicating this mapping a second time.
export const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard', roles: ['owner', 'manager'] },
  {
    label: 'Register',
    path: '/admin/register',
    icon: 'register',
    roles: ['manager', 'employee'],
  },
  {
    label: 'Products',
    path: '/admin/products',
    icon: 'products',
    roles: ['owner', 'manager'],
    requiredPermission: 'MANAGER_MANAGE_PRODUCTS',
  },
  {
    label: 'Inventory',
    path: '/admin/inventory',
    icon: 'inventory',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Sales Reports',
    path: '/admin/reports',
    icon: 'reports',
    roles: ['owner', 'manager'],
  },
  { label: 'Roles', path: '/admin/roles', icon: 'roles', roles: ['owner'] },
  {
    label: 'Activity Log',
    path: '/admin/activity-log',
    icon: 'activity-log',
    roles: ['owner', 'manager'],
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: 'settings',
    // Every role can reach this for the self-service profile/password
    // section - the page itself hides the Owner-only branch/permission
    // cards from non-Owners (see Settings.isOwner). Was owner-only until
    // security-qa-audit-2026-09-25.md's Feature A follow-up: /me and
    // /me/password already existed backend-side but no non-Owner role could
    // reach this page or its API at all.
    roles: ['owner', 'manager', 'employee'],
  },
];

/**
 * Drill-through routes reachable via a link (not the dock rail) but still
 * needing the same per-role enforcement - core/role-guard.ts checks this
 * list too, not just ALL_NAV_ITEMS, so a route left out of the rail doesn't
 * silently become open to every role by default.
 */
export const HIDDEN_GUARDED_ROUTES: { path: string; roles: Role[] }[] = [
  { path: '/admin/activities', roles: ['owner', 'manager'] },
  { path: '/admin/products/archived', roles: ['owner', 'manager'] },
];

@Component({
  selector: 'app-layout',
  standalone: false,
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout implements OnInit, OnDestroy {
  isRoleMenuOpen = false;

  /** Browser-tab-style workspace tabs, opened as routes are visited. */
  openTabs: Tab[] = [];
  activeTabPath = '';

  readonly isDarkMode: Signal<boolean>;
  readonly isAlertsOpen = signal(false);
  readonly alerts = signal<DashboardAlert[]>([]);
  /** Fails closed for Manager (Owner never needs this) - same "hidden until proven enabled" default Products/Roles already use for this same flag. */
  readonly permissions = signal<PermissionFlag[]>([]);

  @ViewChild('alertsWrapper') private alertsWrapper?: ElementRef<HTMLElement>;
  @ViewChild('roleMenuWrapper') private roleMenuWrapper?: ElementRef<HTMLElement>;

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    readonly auth: AuthService,
    private theme: ThemeService,
    private dashboardService: DashboardService,
    private permissionsService: PermissionsService,
    private salesEventsService: SalesEventsService,
    private deepLinkReplay: DeepLinkReplay,
  ) {
    this.isDarkMode = this.theme.isDarkMode;
  }

  /** Closes an open dropdown when a click lands outside its own wrapper - neither dropdown is a native <details>/<select>, so nothing does this by default. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.isAlertsOpen() && !this.alertsWrapper?.nativeElement.contains(target)) {
      this.isAlertsOpen.set(false);
    }
    if (this.isRoleMenuOpen && !this.roleMenuWrapper?.nativeElement.contains(target)) {
      this.isRoleMenuOpen = false;
    }
  }

  ngOnInit(): void {
    // One connection for the whole admin session, opened here since Layout
    // is the persistent shell wrapping every /admin/* route and is never
    // destroyed/recreated on navigation between them - Register, Dashboard
    // and Reports each just read from this shared service rather than
    // opening their own connection (see docs/realtime-sales-sync-spec-2026-09-25.md).
    this.salesEventsService.connect();

    // Layout is created while the router activates the first /admin/* route,
    // so that navigation's NavigationEnd fires after this subscription
    // attaches only on later navigations - Router.events is not replayed.
    // Prime from the in-flight (or current) navigation so the first page
    // after a hard load still gets a tab/title.
    // Guarded: if finalUrl is missing, router.url can still be the previous
    // route ('/' or the login page) - never register that as a tab.
    const initialUrl = this.router.getCurrentNavigation()?.finalUrl?.toString() ?? this.router.url;
    if (initialUrl.startsWith('/admin/') && !initialUrl.startsWith('/admin/login')) {
      this.syncActiveTab(initialUrl);
    }

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.syncActiveTab(this.router.url));

    // Employee has no Products/Inventory/Reports access, so stock alerts
    // (the only alert type today) wouldn't be actionable for that role -
    // skip the fetch entirely rather than surfacing a 403 or a dead bell.
    if (this.canSeeAlerts) {
      this.dashboardService
        .alerts()
        .pipe(catchError(() => of([])))
        .subscribe((alerts) => this.alerts.set(alerts));
    }

    // Owner never needs this (always allowed) - only fetch for Manager,
    // whose access to a requiredPermission-gated nav item depends on it.
    if (this.auth.currentUser()?.role === 'MANAGER') {
      this.permissionsService
        .list()
        .pipe(catchError(() => of([])))
        .subscribe((permissions) => this.permissions.set(permissions));
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    // Navigating away from /admin entirely (e.g. to /admin/login on logout)
    // destroys this component - close the stream rather than leave it open
    // against a session that's ending.
    this.salesEventsService.disconnect();
  }

  get navItems(): NavItem[] {
    const role = this.auth.currentUser()?.role.toLowerCase() as Role | undefined;
    if (!role) return [];
    return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role)).filter(
      (item) =>
        !item.requiredPermission ||
        role !== 'manager' ||
        this.permissionsService.hasPermission(this.permissions(), item.requiredPermission),
    );
  }

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  get canSeeAlerts(): boolean {
    return this.auth.currentUser()?.role !== 'EMPLOYEE';
  }

  toggleAlerts(): void {
    this.isAlertsOpen.update((open) => !open);
  }

  /**
   * Deep-links straight into Inventory's restock flow for this specific product, pre-filling the suggested reorder quantity.
   * branch + highlight additionally open the alert's own branch tab (Owner only - Inventory ignores it for branch-bound roles)
   * and blink the item's row so it is easy to spot in the paginated list.
   */
  routeToAlert(alert: DashboardAlert): void {
    this.isAlertsOpen.set(false);
    const commands = ['/admin/inventory'];
    const queryParams = {
      restock: alert.productId,
      qty: alert.suggestedReorderQty,
      branch: alert.branchCode,
      highlight: alert.productId,
    };
    // Already on exactly this URL: Angular would ignore the navigation, so replay the highlight instead.
    const target = this.router.serializeUrl(this.router.createUrlTree(commands, { queryParams }));
    if (this.router.url === target) {
      this.deepLinkReplay.replay$.next();
      return;
    }
    this.router.navigate(commands, { queryParams });
  }

  /** Title-cases the JWT's uppercase role claim (e.g. "OWNER") for display. */
  get currentRoleLabel(): string {
    const role = this.auth.currentUser()?.role ?? '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  toggleRoleMenu(): void {
    this.isRoleMenuOpen = !this.isRoleMenuOpen;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }

  private syncActiveTab(url: string): void {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    const title = child?.snapshot.data['title'] ?? '';
    this.openTab(url, title);
  }

  /**
   * Keyed by pathname only, not the full URL - `/inventory` and
   * `/inventory?filter=low-stock` are the same logical tab. An already-open
   * tab for this pathname is updated in place (new query params, new title)
   * rather than spawning a duplicate.
   */
  openTab(url: string, title: string): void {
    const path = url.split('?')[0];
    const queryParams = this.router.parseUrl(url).queryParams;
    this.activeTabPath = path;

    const existing = this.openTabs.find((tab) => tab.path === path);
    if (existing) {
      existing.queryParams = queryParams;
      existing.title = title;
    } else {
      this.openTabs.push({ path, queryParams, title });
    }
  }

  closeTab(event: Event, path: string): void {
    event.preventDefault();
    event.stopPropagation();

    const index = this.openTabs.findIndex((tab) => tab.path === path);
    if (index === -1) {
      return;
    }
    const wasActive = this.activeTabPath === path;
    this.openTabs.splice(index, 1);

    if (this.openTabs.length === 0) {
      this.router.navigateByUrl('/admin/dashboard');
      return;
    }
    if (wasActive) {
      const next = this.openTabs[Math.max(0, index - 1)];
      this.router.navigate([next.path], { queryParams: next.queryParams });
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
