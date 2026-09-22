import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface NavItem {
  label: string;
  icon: 'home' | 'services' | 'parts' | 'contact';
  targetId?: string;
  route?: string;
  disabledTitle?: string;
}

export type NavAction = { type: 'anchor'; id: string } | { type: 'route'; path: string };

/**
 * Site-wide floating nav (left dock on desktop, bottom bar on mobile), mounted once
 * outside <router-outlet> by the customer shell. Home/Contact stay anchor-scroll targets
 * on the Home page; Services is a real route. Active state and the hero/footer
 * IntersectionObserver both need to react to route changes since this component is never
 * destroyed/recreated on navigation.
 */
@Component({
  selector: 'app-floating-nav-rail',
  standalone: false,
  styleUrl: './floating-nav-rail.scss',
  templateUrl: './floating-nav-rail.html',
})
export class FloatingNavRail implements AfterViewInit, OnDestroy {
  @Output() navigate = new EventEmitter<NavAction>();

  readonly items: NavItem[] = [
    { label: 'Home', icon: 'home', targetId: 'hero-section' },
    { label: 'Services', icon: 'services', route: '/services' },
    {
      label: 'Parts & Catalog',
      icon: 'parts',
      disabledTitle: 'Parts & Catalog page coming soon',
    },
    { label: 'Contact', icon: 'contact', targetId: 'site-footer' },
  ];

  readonly activeTargetId = signal('hero-section');
  readonly currentUrl = signal('');

  private observer?: IntersectionObserver;
  private routerSub?: Subscription;

  constructor(private readonly router: Router) {
    this.currentUrl.set(this.normalizedPath(this.router.url));
  }

  ngAfterViewInit(): void {
    this.setupObserver();
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.normalizedPath(this.router.url));
        this.setupObserver();
      });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.routerSub?.unsubscribe();
  }

  goTo(item: NavItem): void {
    if (item.route) {
      this.navigate.emit({ type: 'route', path: item.route });
    } else if (item.targetId) {
      this.navigate.emit({ type: 'anchor', id: item.targetId });
    }
  }

  isActive(item: NavItem): boolean {
    if (item.route) {
      return this.currentUrl() === item.route;
    }
    return !!item.targetId && this.currentUrl() === '/' && this.activeTargetId() === item.targetId;
  }

  /** Router.url includes query/hash (e.g. a tracking param or a device-preview tool's own
   *  appended state), which would otherwise break an exact '/' comparison. */
  private normalizedPath(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  /** Re-run on every navigation - hero-section/site-footer only exist on '/', so a direct
   *  load of another route must not leave a stale observer watching detached elements.
   *  Retries briefly on a fresh bootstrap: this component is a template sibling of
   *  <router-outlet>, so there's no guarantee Home's own elements have painted into the
   *  DOM yet the first time this runs. */
  private setupObserver(attempt = 0): void {
    this.observer?.disconnect();

    const observedIds = ['hero-section', 'site-footer'];
    const targets = observedIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) {
      if (attempt < 20) {
        setTimeout(() => this.setupObserver(attempt + 1), 50);
      }
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        // Ratio-of-target-visible, not a viewport center-band: the footer is
        // shorter than half the viewport, so it can sit fully visible at the
        // bottom of the page without ever crossing a fixed center band.
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }
        const mostVisible = visible.reduce((a, b) =>
          a.intersectionRatio > b.intersectionRatio ? a : b,
        );
        this.activeTargetId.set(mostVisible.target.id);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    targets.forEach((target) => this.observer?.observe(target));
  }
}
