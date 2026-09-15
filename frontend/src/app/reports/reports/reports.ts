import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { ReportsService, SalesReport } from '../reports';

@Component({
  selector: 'app-reports',
  standalone: false,
  styleUrl: './reports.css',
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  readonly report = signal<SalesReport | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(false);
  readonly selectedBranch = signal<string | null>(null);

  readonly branchOptions = [
    { value: null, label: 'Both branches' },
    { value: 'MAIN', label: 'Main Branch' },
    { value: 'MASINAG', label: 'Masinag Branch' },
  ];

  readonly fromDate = signal('');
  readonly toDate = signal('');

  constructor(
    private reportsService: ReportsService,
    readonly auth: AuthService,
  ) {}

  get isOwner(): boolean {
    return this.auth.currentUser()?.role === 'OWNER';
  }

  ngOnInit(): void {
    this.loadReport();
  }

  selectBranch(branchCode: string | null): void {
    this.selectedBranch.set(branchCode);
    this.loadReport();
  }

  applyDateRange(from: string, to: string): void {
    this.fromDate.set(from);
    this.toDate.set(to);
    this.loadReport();
  }

  private loadReport(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.reportsService
      .salesReport({
        from: this.fromDate() || undefined,
        to: this.toDate() || undefined,
        branchCode: this.selectedBranch() ?? undefined,
      })
      .subscribe({
        next: (report) => {
          this.loading.set(false);
          this.report.set(report);
          this.fromDate.set(report.from);
          this.toDate.set(report.to);
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Could not load the sales report.');
        },
      });
  }
}
