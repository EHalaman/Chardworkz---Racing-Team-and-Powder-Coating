import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'chardworkz-theme';
const LIGHT_STATUS_BAR_COLOR = '#F5F5F5'; // matches nav-bg, the color at the very top of the app shell
const DARK_STATUS_BAR_COLOR = '#0f172a'; // Tailwind slate-900, matches Layout's dark:bg-slate-900

// Extracted out of Layout (was dock-only) so the Settings screen's app
// preferences section can show/toggle the exact same state instead of a
// second, potentially-drifting copy of it.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(false);

  constructor() {
    this.apply(this.readStored());
  }

  toggle(): void {
    this.apply(!this.isDarkMode());
  }

  private apply(dark: boolean): void {
    this.isDarkMode.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? DARK_STATUS_BAR_COLOR : LIGHT_STATUS_BAR_COLOR);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    } catch {
      // localStorage unavailable (private mode, etc.) - theme just won't persist.
    }
  }

  private readStored(): boolean {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
