import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, signal } from '@angular/core';

interface NavItem {
  label: string;
  icon: 'home' | 'services' | 'parts' | 'contact';
  targetId: string;
  disabledTitle?: string;
}

/**
 * Site-wide floating nav (left dock on desktop, bottom bar on mobile).
 * No routerLink here - the public site is a single anchor-scroll page
 * (see app-routing-module.ts, only '' -> Home), so "active" is derived
 * from which section is currently in view, not the URL.
 */
@Component({
  selector: 'app-floating-nav-rail',
  standalone: false,
  styleUrl: './floating-nav-rail.scss',
  templateUrl: './floating-nav-rail.html',
})
export class FloatingNavRail implements AfterViewInit, OnDestroy {
  @Output() navigate = new EventEmitter<string>();

  readonly items: NavItem[] = [
    { label: 'Home', icon: 'home', targetId: 'hero-section' },
    {
      label: 'Services',
      icon: 'services',
      targetId: '',
      disabledTitle: 'Services page coming soon',
    },
    {
      label: 'Parts & Catalog',
      icon: 'parts',
      targetId: '',
      disabledTitle: 'Parts & Catalog page coming soon',
    },
    { label: 'Contact', icon: 'contact', targetId: 'site-footer' },
  ];

  readonly activeTargetId = signal('hero-section');

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const observedIds = ['hero-section', 'site-footer'];
    const targets = observedIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) {
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

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  goTo(item: NavItem): void {
    if (!item.targetId) {
      return;
    }
    this.navigate.emit(item.targetId);
  }
}
