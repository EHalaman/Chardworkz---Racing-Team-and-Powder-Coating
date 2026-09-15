import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  branchCode: string;
}

const STORAGE_KEY = 'chardworkz.auth';

// Persisted to localStorage (not memory-only) so a counter station stays
// logged in across a reload or reboot mid-shift - same XSS exposure as any
// SPA storing its token in localStorage, accepted for this dev-only phase.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<LoginResponse | null>(this.readStoredSession());
  readonly currentUser = this.session.asReadonly();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, { username, password })
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session.set(null);
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
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
