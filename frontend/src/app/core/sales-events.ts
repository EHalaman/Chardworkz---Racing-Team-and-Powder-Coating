import { Injectable, signal } from '@angular/core';
import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

export interface SaleRecordedEvent {
  branchCode: string;
  saleId: string;
  soldAt: string;
}

/** Stops fetchEventSource's default infinite-retry loop - see connect()'s onopen handler. */
class FatalSseError extends Error {}

/**
 * One shared SSE connection for the whole admin session (Register, Dashboard
 * and Reports all read from this, none of them own the connection - see
 * docs/realtime-sales-sync-spec-2026-09-25.md). Uses
 * @microsoft/fetch-event-source rather than the native EventSource: the
 * native API cannot send a custom Authorization header, and putting the JWT
 * in the URL as a query parameter would leak it into Railway's proxy access
 * logs and browser history - the same token-handling standard this app held
 * to for Ticket 1's expiry check and Ticket 4's revocation work.
 *
 * saleRecorded$/reconnected$ are plain RxJS Subjects, not signals -
 * deliberately. A `code-review` pass caught a real race in an earlier
 * signal-based version: a consumer's effect() skipped its first execution
 * to avoid treating the signal's initial `null` as a real event, but if a
 * genuine event arrived before that effect's first scheduled flush, it got
 * silently treated as the "baseline" and swallowed instead of triggering a
 * refresh. A Subject has no replayed "current value" for a late subscriber
 * to misread as a baseline in the first place - every subscriber only ever
 * sees emissions that happen after it subscribes, so no such race exists.
 */
@Injectable({ providedIn: 'root' })
export class SalesEventsService {
  private readonly saleRecordedSubject = new Subject<SaleRecordedEvent>();
  private readonly reconnectedSubject = new Subject<void>();
  readonly saleRecorded$ = this.saleRecordedSubject.asObservable();
  readonly reconnected$ = this.reconnectedSubject.asObservable();

  /** Genuine ongoing state (is the connection open right now), not a one-shot notification - a signal is the right fit here, unlike the two streams above. */
  readonly connected = signal(false);

  private controller: AbortController | null = null;
  private hasConnectedBefore = false;

  constructor(private auth: AuthService) {}

  /** Idempotent - a second call while already connected/connecting is a no-op. */
  connect(): void {
    if (this.controller) {
      return;
    }
    const token = this.auth.getToken();
    if (!token) {
      return;
    }

    this.controller = new AbortController();
    fetchEventSource(`${environment.apiBaseUrl}/api/events/sse`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: this.controller.signal,
      // Keep receiving events while the tab is backgrounded - a Manager's
      // dashboard shouldn't silently go stale just because it lost focus.
      openWhenHidden: true,
      onopen: async (response) => {
        if (!response.ok) {
          // A 401 here means the token is dead (expired/revoked) - retrying
          // forever against the same bad token is pointless; the existing
          // authGuard/interceptor own re-auth, this just stops the loop.
          if (response.status === 401) {
            throw new FatalSseError('SSE handshake unauthorized');
          }
          throw new Error(`SSE handshake failed: ${response.status}`);
        }
        this.connected.set(true);
        if (this.hasConnectedBefore) {
          this.reconnectedSubject.next();
        }
        this.hasConnectedBefore = true;
      },
      onmessage: (message: EventSourceMessage) => {
        if (message.event === 'SALE_RECORDED' && message.data) {
          this.saleRecordedSubject.next(JSON.parse(message.data) as SaleRecordedEvent);
        }
      },
      onerror: (err) => {
        this.connected.set(false);
        if (err instanceof FatalSseError) {
          throw err; // stop retrying
        }
        // Anything else (dropped connection, brief network blip) - swallow
        // and let fetchEventSource's own exponential backoff retry.
      },
    }).catch(() => {
      // FatalSseError (or an aborted signal from disconnect()) lands here -
      // nothing further to do, the connection is deliberately not retrying.
      this.connected.set(false);
    });
  }

  disconnect(): void {
    this.controller?.abort();
    this.controller = null;
    this.connected.set(false);
  }
}
