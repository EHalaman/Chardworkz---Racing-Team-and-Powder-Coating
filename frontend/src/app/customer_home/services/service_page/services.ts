import { Component } from '@angular/core';

const ASSETS = 'assets/SHOW_CASE_HOMEPAGE/SERVICES_PAGE';

@Component({
  selector: 'app-services',
  standalone: false,
  styleUrl: './services.scss',
  templateUrl: './services.html',
})
export class Services {
  readonly heroBackground = `${ASSETS}/HERO-background.png`;

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
