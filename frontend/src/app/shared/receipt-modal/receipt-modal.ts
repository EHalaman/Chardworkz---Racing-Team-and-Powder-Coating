import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { SaleReceipt } from '../../register/sales';

export interface ReceiptLineGroup {
  packageId: number | null;
  packageName: string | null;
  lines: SaleReceipt['lines'];
  total: number;
}

/**
 * Dual-tab (Customer Receipt / Sales Audit Breakdown) receipt, extracted
 * after Reports' "Recent Sales" drill-down (`reports.html`) was found to
 * still be running a stale, pre-DEC-084 copy of Register's own modal - flat
 * item list, no package grouping, no audit tab - because the two were never
 * kept in sync after Register's own copy evolved. Both call sites now render
 * this one component instead of maintaining parallel templates.
 *
 * Owns its own close animation (fade/pop out over ~180ms, matching the
 * timing the original inline modals used) so the host only needs to null out
 * its `activeReceipt` signal on `(closed)`, not manage the animation itself.
 */
@Component({
  selector: 'app-receipt-modal',
  standalone: false,
  styleUrl: './receipt-modal.css',
  templateUrl: './receipt-modal.html',
})
export class ReceiptModal implements OnChanges {
  @Input({ required: true }) receipt!: SaleReceipt;
  @Output() closed = new EventEmitter<void>();

  readonly tab = signal<'customer' | 'audit'>('customer');
  readonly isClosing = signal(false);

  /** A reprint while the modal is already open (or mid-close) must never render the new receipt mid-exit-animation or leave it stuck on the audit tab from a previous view. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['receipt']) {
      this.isClosing.set(false);
      this.tab.set('customer');
    }
  }

  /** Groups by packageId (not packageName - two distinct packages could share a name, since service_package.name has no unique constraint) so the Customer tab can nest components under one heading with no sub-prices. */
  get groupedLines(): ReceiptLineGroup[] {
    const groups: ReceiptLineGroup[] = [];
    for (const line of this.receipt.lines) {
      let group = groups.find((g) => g.packageId === line.packageId);
      if (!group) {
        group = { packageId: line.packageId, packageName: line.packageName, lines: [], total: 0 };
        groups.push(group);
      }
      group.lines.push(line);
      group.total += line.lineTotal;
    }
    return groups;
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      if (this.isClosing()) {
        this.closed.emit();
        this.isClosing.set(false);
      }
    }, 180);
  }

  /** Always prints the Customer tab regardless of which tab is on screen - only that tab carries the `.print-area` class. The setTimeout lets Angular re-render onto it before the print dialog captures the page. */
  print(): void {
    this.tab.set('customer');
    setTimeout(() => window.print(), 0);
  }
}
