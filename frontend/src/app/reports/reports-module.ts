import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reports } from './reports/reports';

@NgModule({
  declarations: [Reports],
  imports: [CommonModule],
  exports: [Reports],
})
export class ReportsModule {}
