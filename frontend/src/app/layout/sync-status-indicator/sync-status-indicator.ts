import { Component } from '@angular/core';
import { OfflineSaleQueueService } from '../../offline-sales/offline-sale-queue';

/** Sync-state pill for the offline sale queue (Q12) - lives in the shell header. */
@Component({
  selector: 'app-sync-status-indicator',
  standalone: false,
  templateUrl: './sync-status-indicator.html',
})
export class SyncStatusIndicator {
  constructor(readonly queue: OfflineSaleQueueService) {}

  retry(): void {
    void this.queue.retryFailed();
  }
}
