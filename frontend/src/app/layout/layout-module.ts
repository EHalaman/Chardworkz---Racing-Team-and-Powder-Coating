import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Layout } from './layout/layout';
import { SyncStatusIndicator } from './sync-status-indicator/sync-status-indicator';

@NgModule({
  declarations: [Layout, SyncStatusIndicator],
  imports: [CommonModule, RouterModule],
  exports: [Layout],
})
export class LayoutModule {}
