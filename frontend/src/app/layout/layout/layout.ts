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
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['owner', 'manager'] },
  { label: 'Register', path: '/register', icon: 'register', roles: ['manager', 'employee'] },
  { label: 'Products', path: '/products', icon: 'products', roles: ['owner', 'manager'] },
  { label: 'Inventory', path: '/inventory', icon: 'inventory', roles: ['owner', 'manager'] },
  { label: 'Sales Reports', path: '/reports', icon: 'reports', roles: ['owner', 'manager'] },
  { label: 'Roles', path: '/roles', icon: 'roles', roles: ['owner'] },
  {
    label: 'Activity Log',
    path: '/activity-log',
    icon: 'activity-log',
    roles: ['owner', 'manager'],
  },
  { label: 'Settings', path: '/settings', icon: 'settings', roles: ['owner'] },
];

/**
 * Drill-through routes reachable via a link (not the dock rail) but still
 * needing the same per-role enforcement - core/role-guard.ts checks this
 * list too, not just ALL_NAV_ITEMS, so a route left out of the rail doesn't
 * silently become open to every role by default.
 */
export const HIDDEN_GUARDED_ROUTES: { path: string; roles: Role[] }[] = [
  { path: '/activities', roles: ['owner', 'manager'] },
  { path: '/products/archived', roles: ['owner', 'manager'] },
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

  @ViewChild('alertsWrapper') private alertsWrapper?: ElementRef<HTMLElement>;
  @ViewChild('roleMenuWrapper') private roleMenuWrapper?: ElementRef<HTMLElement>;

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    readonly auth: AuthService,
    private theme: ThemeService,
    private dashboardService: DashboardService,
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
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        const title = child?.snapshot.data['title'] ?? '';
        this.openTab(this.router.url, title);
      });

    // Employee has no Products/Inventory/Reports access, so stock alerts
    // (the only alert type today) wouldn't be actionable for that role -
    // skip the fetch entirely rather than surfacing a 403 or a dead bell.
    if (this.canSeeAlerts) {
      this.dashboardService
        .alerts()
        .pipe(catchError(() => of([])))
        .subscribe((alerts) => this.alerts.set(alerts));
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  get navItems(): NavItem[] {
    const role = this.auth.currentUser()?.role.toLowerCase() as Role | undefined;
    return role ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
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

  /** Deep-links straight into Inventory's restock flow for this specific product, pre-filling the suggested reorder quantity. */
  routeToAlert(alert: DashboardAlert): void {
    this.isAlertsOpen.set(false);
    this.router.navigate(['/inventory'], {
      queryParams: { restock: alert.productId, qty: alert.suggestedReorderQty },
    });
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
    this.router.navigateByUrl('/login');
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
      this.router.navigateByUrl('/dashboard');
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
