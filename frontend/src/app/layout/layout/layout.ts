import { Component, OnDestroy, OnInit, Signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/auth';
import { ThemeService } from '../../core/theme';

export type Role = 'owner' | 'manager' | 'employee';

export interface NavItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'register' | 'products' | 'inventory' | 'reports' | 'roles' | 'settings';
  roles: Role[];
}

export interface Tab {
  path: string;
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
  { label: 'Settings', path: '/settings', icon: 'settings', roles: ['owner'] },
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

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    readonly auth: AuthService,
    private theme: ThemeService,
  ) {
    this.isDarkMode = this.theme.isDarkMode;
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
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  get navItems(): NavItem[] {
    const role = this.auth.currentUser()?.role.toLowerCase() as Role | undefined;
    return role ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
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

  openTab(path: string, title: string): void {
    this.activeTabPath = path;
    if (!this.openTabs.some((tab) => tab.path === path)) {
      this.openTabs.push({ path, title });
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
      this.router.navigateByUrl(next.path);
    }
  }

  toggleTheme(): void {
    this.theme.toggle();
  }
}
