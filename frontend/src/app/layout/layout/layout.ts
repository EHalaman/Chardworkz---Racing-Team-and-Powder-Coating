import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

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

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['owner', 'manager'] },
  { label: 'Register', path: '/register', icon: 'register', roles: ['manager', 'employee'] },
  { label: 'Products', path: '/products', icon: 'products', roles: ['owner', 'manager'] },
  { label: 'Inventory', path: '/inventory', icon: 'inventory', roles: ['owner', 'manager'] },
  { label: 'Sales Reports', path: '/reports', icon: 'reports', roles: ['owner', 'manager'] },
  { label: 'Roles', path: '/roles', icon: 'roles', roles: ['owner'] },
  { label: 'Settings', path: '/settings', icon: 'settings', roles: ['owner', 'manager'] },
];

const THEME_STORAGE_KEY = 'chardworkz-theme';

@Component({
  selector: 'app-layout',
  standalone: false,
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout implements OnInit, OnDestroy {
  readonly roleOptions: { value: Role; label: string }[] = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' },
  ];

  /**
   * Role switcher is a scaffolding aid only, until real auth/JWT-derived
   * role exists. Defaults to Owner per priority for this build pass.
   */
  currentRole: Role = 'owner';
  isRoleMenuOpen = false;

  /** Browser-tab-style workspace tabs, opened as routes are visited. */
  openTabs: Tab[] = [];
  activeTabPath = '';

  readonly isDarkMode = signal(false);

  private routerSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.applyTheme(this.readStoredTheme());

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
    return ALL_NAV_ITEMS.filter((item) => item.roles.includes(this.currentRole));
  }

  get currentRoleLabel(): string {
    return this.roleOptions.find((r) => r.value === this.currentRole)?.label ?? '';
  }

  toggleRoleMenu(): void {
    this.isRoleMenuOpen = !this.isRoleMenuOpen;
  }

  setRole(role: Role): void {
    this.currentRole = role;
    this.isRoleMenuOpen = false;
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
    const next = !this.isDarkMode();
    this.applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      // localStorage unavailable (private mode, etc.) - theme just won't persist.
    }
  }

  private applyTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }

  private readStoredTheme(): boolean {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
