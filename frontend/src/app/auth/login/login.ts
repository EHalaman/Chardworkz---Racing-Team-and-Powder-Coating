import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  toggleShowPassword(): void {
    this.showPassword.update((show) => !show);
  }

  onSubmit(username: string, password: string): void {
    this.errorMessage.set(null);
    this.submitting.set(true);
    this.auth.login(username, password).subscribe({
      next: (response) => {
        this.submitting.set(false);
        // Employee has no Dashboard access (Layout.ALL_NAV_ITEMS) - send them
        // straight to the one screen their role can actually use.
        const destination = response.role === 'EMPLOYEE' ? '/register' : '/dashboard';
        this.router.navigateByUrl(destination);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Invalid username or password');
      },
    });
  }
}
