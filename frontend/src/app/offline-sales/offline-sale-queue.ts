import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface QueuedSaleLine {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface NewSalePayload {
  paymentMethod: string;
  paymentReference?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  lines: QueuedSaleLine[];
}

export interface QueuedSale extends NewSalePayload {
  id: string;
  soldAt: string;
  status: SyncStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  syncedAt?: string;
}

interface SaleAckResponse {
  id: string;
  alreadySynced: boolean;
}

const DB_NAME = 'chardworkz-offline';
const DB_VERSION = 1;
const STORE = 'pending-sales';
const MAX_BACKOFF_MS = 60_000;
const BASE_BACKOFF_MS = 5_000;
const SYNCED_RETENTION_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;

/**
 * Client-side offline sale queue (Q12, resolved 2026-09-15: local queue +
 * sync-on-reconnect, not paper fallback). Sales are persisted to IndexedDB
 * keyed by a client-generated UUID matching `sale.id`'s server-side idempotency
 * key, so a retried sync of the same sale is always a no-op, never a duplicate.
 */
@Injectable({ providedIn: 'root' })
export class OfflineSaleQueueService {
  readonly pendingCount = signal(0);
  readonly failedCount = signal(0);

  private readonly dbPromise: Promise<IDBPDatabase>;
  private syncing = false;

  constructor(private http: HttpClient) {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      },
    });

    window.addEventListener('online', () => void this.syncNow());
    // Fallback poll: `online` can fire while the connection is still actually
    // flaky, so a due-but-still-failing sale needs a second chance without
    // waiting for another connectivity transition.
    setInterval(() => {
      if (navigator.onLine) void this.syncNow();
    }, POLL_INTERVAL_MS);

    void this.refreshCounts();
    void this.syncNow();
  }

  async enqueueSale(payload: NewSalePayload): Promise<string> {
    const record: QueuedSale = {
      ...payload,
      id: crypto.randomUUID(),
      soldAt: new Date().toISOString(),
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: 0,
    };

    const db = await this.dbPromise;
    await db.put(STORE, record);
    await this.refreshCounts();
    void this.syncNow();
    return record.id;
  }

  /** Manually re-arms every terminal FAILED sale for another sync attempt. */
  async retryFailed(): Promise<void> {
    const db = await this.dbPromise;
    const all = (await db.getAll(STORE)) as QueuedSale[];
    for (const sale of all.filter((s) => s.status === 'FAILED')) {
      sale.status = 'PENDING';
      sale.attempts = 0;
      sale.nextAttemptAt = 0;
      sale.lastError = undefined;
      await db.put(STORE, sale);
    }
    await this.refreshCounts();
    void this.syncNow();
  }

  async syncNow(): Promise<void> {
    if (this.syncing) {
      return;
    }
    this.syncing = true;
    try {
      const db = await this.dbPromise;
      await this.pruneSynced(db);

      const now = Date.now();
      const due = ((await db.getAll(STORE)) as QueuedSale[])
        .filter((sale) => sale.status === 'PENDING' && sale.nextAttemptAt <= now)
        .sort((a, b) => a.soldAt.localeCompare(b.soldAt));

      // Sequential, not parallel: a single register's queue depth never
      // justifies the added complexity of concurrent in-flight syncs.
      for (const sale of due) {
        await this.attemptSync(db, sale);
      }
      await this.refreshCounts();
    } finally {
      this.syncing = false;
    }
  }

  private async attemptSync(db: IDBPDatabase, sale: QueuedSale): Promise<void> {
    sale.status = 'SYNCING';
    await db.put(STORE, sale);

    try {
      await firstValueFrom(
        this.http.post<SaleAckResponse>(`${environment.apiBaseUrl}/api/sales`, {
          id: sale.id,
          paymentMethod: sale.paymentMethod,
          paymentReference: sale.paymentReference ?? null,
          customerName: sale.customerName ?? null,
          customerPhone: sale.customerPhone ?? null,
          customerEmail: sale.customerEmail ?? null,
          soldAt: sale.soldAt,
          lines: sale.lines,
        }),
      );
      sale.status = 'SYNCED';
      sale.syncedAt = new Date().toISOString();
      await db.put(STORE, sale);
    } catch (error) {
      const httpError = error instanceof HttpErrorResponse ? error : null;
      // status 0 means the request never reached a server (offline, DNS
      // failure, CORS-blocked, etc.) - a real HTTP response (4xx/5xx) means
      // the server was reachable and rejected the request on its merits.
      const isNetworkError = !httpError || httpError.status === 0;

      if (isNetworkError) {
        sale.status = 'PENDING';
        sale.attempts += 1;
        sale.nextAttemptAt =
          Date.now() + Math.min(BASE_BACKOFF_MS * 2 ** (sale.attempts - 1), MAX_BACKOFF_MS);
        sale.lastError = 'Network error - will retry automatically';
      } else {
        sale.status = 'FAILED';
        sale.lastError = httpError.error?.error ?? httpError.message ?? 'Sync rejected by server';
      }
      await db.put(STORE, sale);
    }
  }

  private async pruneSynced(db: IDBPDatabase): Promise<void> {
    const cutoff = Date.now() - SYNCED_RETENTION_MS;
    const all = (await db.getAll(STORE)) as QueuedSale[];
    for (const sale of all) {
      if (sale.status === 'SYNCED' && sale.syncedAt && new Date(sale.syncedAt).getTime() < cutoff) {
        await db.delete(STORE, sale.id);
      }
    }
  }

  private async refreshCounts(): Promise<void> {
    const db = await this.dbPromise;
    const all = (await db.getAll(STORE)) as QueuedSale[];
    this.pendingCount.set(
      all.filter((s) => s.status === 'PENDING' || s.status === 'SYNCING').length,
    );
    this.failedCount.set(all.filter((s) => s.status === 'FAILED').length);
  }
}
