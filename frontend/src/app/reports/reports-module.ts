import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { Reports } from './reports/reports';

@NgModule({
  declarations: [Reports],
  imports: [CommonModule, SharedModule],
  exports: [Reports],
})
export class ReportsModule {}
