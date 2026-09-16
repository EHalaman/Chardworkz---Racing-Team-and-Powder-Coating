import { Component, OnInit, signal } from '@angular/core';
import { ActionType, ActivityLogEntry, ActivityLogService } from '../activity-log';

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

  readonly toDate: string;
  readonly fromDate: string;

  readonly actionTypeOptions: { value: ActionType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All actions' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
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

  load(from: string, to: string): void {
    this.errorMessage.set(null);
    this.loading.set(true);
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
