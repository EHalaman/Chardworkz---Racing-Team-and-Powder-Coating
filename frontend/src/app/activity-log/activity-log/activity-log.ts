import { Component, OnInit, signal } from '@angular/core';
import { ActionType, ActivityLogEntry, ActivityLogService } from '../activity-log';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-activity-log',
  standalone: false,
  styleUrl: './activity-log.css',
  templateUrl: './activity-log.html',
})
export class ActivityLog implements OnInit {
  readonly entries = signal<ActivityLogEntry[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);

  readonly actionTypeFilter = signal<ActionType | 'ALL'>('ALL');
  readonly actorFilter = signal<number | 'ALL'>('ALL');
  readonly currentPage = signal(1);
  readonly selectedEntry = signal<ActivityLogEntry | null>(null);

  readonly toDate: string;
  readonly fromDate: string;

  readonly actionTypeOptions: { value: ActionType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'EXCEL_IMPORT', label: 'Excel import' },
  ];

  constructor(private activityLogService: ActivityLogService) {
    const today = new Date();
    this.toDate = this.toIsoDate(today);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    this.fromDate = this.toIsoDate(thirtyDaysAgo);
  }

  ngOnInit(): void {
    this.load(this.fromDate, this.toDate);
  }

  get actorOptions(): { id: number; name: string }[] {
    const seen = new Map<number, string>();
    for (const entry of this.entries()) {
      seen.set(entry.actorId, entry.actorName);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }

  /** actorOptions returns a new array every check; trackBy keeps *ngFor from tearing down and recreating every <option> (which could otherwise reset the select's own displayed value) on every change-detection pass. */
  trackByActorId(_index: number, actor: { id: number }): number {
    return actor.id;
  }

  get filteredEntries(): ActivityLogEntry[] {
    return this.entries()
      .filter((e) => this.actionTypeFilter() === 'ALL' || e.actionType === this.actionTypeFilter())
      .filter((e) => this.actorFilter() === 'ALL' || e.actorId === this.actorFilter());
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEntries.length / PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedEntries(): ActivityLogEntry[] {
    const page = Math.min(this.currentPage(), this.totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredEntries.slice(start, start + PAGE_SIZE);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  setActionTypeFilter(value: ActionType | 'ALL'): void {
    this.actionTypeFilter.set(value);
    this.currentPage.set(1);
  }

  setActorFilter(value: number | 'ALL'): void {
    this.actorFilter.set(value);
    this.currentPage.set(1);
  }

  openEntryDetail(entry: ActivityLogEntry): void {
    this.selectedEntry.set(entry);
  }

  closeEntryDetail(): void {
    this.selectedEntry.set(null);
  }

  load(from: string, to: string): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.currentPage.set(1);
    this.activityLogService.list({ from, to }).subscribe({
      next: (entries) => {
        this.loading.set(false);
        this.entries.set(entries);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load the activity log.');
      },
    });
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
