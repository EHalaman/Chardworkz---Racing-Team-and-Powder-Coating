import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

// environment.apiBaseUrl is '' in production (same-origin deployment), and
// '' is a prefix of every string - so a plain startsWith() check would also
// match unrelated third-party request URLs and leak the token to them.
function isApiRequest(url: string): boolean {
  return environment.apiBaseUrl ? url.startsWith(environment.apiBaseUrl) : url.startsWith('/api/');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.getToken();
  if (!token) {
    // No token to attach - this is either the login request itself (a 401
    // here just means wrong credentials, not a dead session) or an
    // already-logged-out state, so no logout/redirect side effect applies.
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // A 401 on a request that *did* carry a token means the session died
        // (expired/invalidated) server-side, not a login failure.
        auth.logout();
        inject(Router).navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
