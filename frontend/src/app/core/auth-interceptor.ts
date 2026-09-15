import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
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

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
