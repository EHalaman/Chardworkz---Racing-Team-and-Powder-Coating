import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActivityLog } from './activity-log/activity-log';

@NgModule({
  declarations: [ActivityLog],
  imports: [CommonModule],
  exports: [ActivityLog],
})
export class ActivityLogModule {}
