import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { normalizedPath } from '../../core/utils/url.util';
import { scrollToElement } from '../../core/utils/scroll-to-element.util';
import { NavAction } from '../../shared/floating-nav-rail/floating-nav-rail';

/**
 * Wraps every customer-facing route (Home, Services, ...) so the floating nav rail
 * mounts once here, outside <router-outlet>, instead of being re-created per page.
 */
@Component({
  selector: 'app-customer-shell',
  standalone: false,
  templateUrl: './customer-shell.html',
})
export class CustomerShell {
  constructor(private readonly router: Router) {}

  onNavigate(action: NavAction): void {
    if (action.type === 'route') {
      this.router.navigate([action.path]);
      return;
    }

    if (normalizedPath(this.router.url) === '/') {
      scrollToElement(action.id);
      return;
    }

    this.router.navigate(['/']).then(() => scrollToElement(action.id));
  }
}
