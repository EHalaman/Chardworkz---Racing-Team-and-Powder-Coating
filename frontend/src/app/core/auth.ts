import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionsService } from './permissions';

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  branchCode: string;
}

const STORAGE_KEY = 'chardworkz.auth';

/**
 * Decodes a JWT's payload (no signature check - the backend is the only
 * party that needs to trust this token; here we only need its `exp` claim to
 * decide whether it's still worth sending) and reports whether it has
 * expired. Anything unparseable is treated as expired so a corrupt value in
 * localStorage fails closed instead of being sent as if valid.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp as number | undefined;
    return typeof exp !== 'number' || Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

// Persisted to localStorage (not memory-only) so a counter station stays
// logged in across a reload or reboot mid-shift - same XSS exposure as any
// SPA storing its token in localStorage, accepted for this dev-only phase.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<LoginResponse | null>(this.readStoredSession());
  readonly currentUser = this.session.asReadonly();

  constructor(
    private http: HttpClient,
    private permissions: PermissionsService,
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, { username, password })
      .pipe(
        tap((response) => {
          // A different Manager may be signing in on this same shared tab -
          // never let their session read another user's cached flags.
          this.permissions.clear();
          this.persistSession(response);
        }),
      );
  }

  /** Called after a self-service profile edit re-issues a token with a new fullName claim. */
  updateSession(response: LoginResponse): void {
    this.persistSession(response);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
    this.permissions.clear();
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  /**
   * For authGuard: true only for a token that both exists and hasn't passed
   * its own `exp` claim yet. Deliberately separate from getToken(), which
   * the interceptor also uses to decide whether to attach an Authorization
   * header - an expired-but-present token should still be sent so the
   * backend's 401 drives the interceptor's existing logout+redirect; this
   * check exists so the guard can reject it before the route ever renders,
   * instead of mounting the page with zeroed-out data until that 401 arrives
   * (security-qa-audit-2026-09-25.md, Ticket 1).
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    return token !== null && !isTokenExpired(token);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    this.session.set(response);
  }

  private readStoredSession(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
