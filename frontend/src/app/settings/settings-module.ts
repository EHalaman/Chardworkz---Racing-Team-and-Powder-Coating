import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { Settings } from './settings/settings';

@NgModule({
  declarations: [Settings],
  imports: [CommonModule, SharedModule],
  exports: [Settings],
})
export class SettingsModule {}
