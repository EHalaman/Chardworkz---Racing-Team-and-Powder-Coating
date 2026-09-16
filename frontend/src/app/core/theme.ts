import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'chardworkz-theme';

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
