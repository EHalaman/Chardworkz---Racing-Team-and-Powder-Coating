import { Component, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { DashboardActivity, DashboardService } from '../../dashboard/dashboard';

const ACTIVITY_LIMIT = 50;

@Component({
  selector: 'app-activities',
  standalone: false,
  styleUrl: './activities.css',
  templateUrl: './activities.html',
})
export class Activities implements OnInit {
  readonly activities = signal<DashboardActivity[]>([]);

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService
      .activity(ACTIVITY_LIMIT)
      .pipe(catchError(() => of<DashboardActivity[]>([])))
      .subscribe((activities) => this.activities.set(activities));
  }
}
