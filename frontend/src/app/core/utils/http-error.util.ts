import { HttpErrorResponse } from '@angular/common/http';

/**
 * Every backend validation failure in this app is a ResponseStatusException
 * with an author-written reason string, and server.error.include-message=always
 * (see application.properties) puts that string in the JSON body's `message`
 * field - so surfacing it directly is more accurate (and stays in sync
 * automatically) than hand-duplicating the same wording in a second,
 * hardcoded client-side string per status code. Falls back to `fallback` for
 * anything without a usable message: a network failure, a 401 (the
 * interceptor already redirects to login before this would render anyway),
 * or a 5xx with no author-written reason.
 */
export function backendErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const message = error.error?.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
}
