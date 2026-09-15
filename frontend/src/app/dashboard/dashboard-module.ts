import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Dashboard } from './dashboard/dashboard';

@NgModule({
  declarations: [Dashboard],
  imports: [CommonModule, BaseChartDirective],
  exports: [Dashboard],
})
export class DashboardModule {}
