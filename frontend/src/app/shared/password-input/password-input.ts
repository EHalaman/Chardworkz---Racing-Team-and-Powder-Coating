import { Component, Input, signal } from '@angular/core';

/**
 * Password field + its show/hide eye toggle, as one drop-in replacement for
 * a plain `<input type="password">`. Extracted after a code review flagged
 * the eye/eye-off SVG pair and toggle wiring duplicated across login.html,
 * settings.html and roles.html (7 copies after this session's Reset
 * Password modal and Confirm-password additions).
 *
 * Deliberately exposes `value` as a plain get/set accessor (not a signal or
 * a method) so every existing call site - `saveProfile(fullName.value)`,
 * `currentPassword.value = ''` - keeps working unchanged after swapping the
 * template reference from a native `<input>` onto `<app-password-input>`:
 * Angular gives `#ref` the component instance by default, and a get/set
 * pair reads and writes through a template reference exactly like a native
 * DOM property does.
 */
@Component({
  selector: 'app-password-input',
  standalone: false,
  styleUrl: './password-input.css',
  templateUrl: './password-input.html',
})
export class PasswordInput {
  @Input() id?: string;
  @Input() name?: string;
  @Input() autocomplete?: string;
  @Input() required = false;

  readonly show = signal(false);
  private currentValue = '';

  get value(): string {
    return this.currentValue;
  }

  set value(next: string) {
    this.currentValue = next;
  }

  toggleShow(): void {
    this.show.update((show) => !show);
  }

  onInput(value: string): void {
    this.currentValue = value;
  }
}
