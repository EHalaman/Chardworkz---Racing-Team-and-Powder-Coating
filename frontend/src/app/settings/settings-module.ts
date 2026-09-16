import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Settings } from './settings/settings';

@NgModule({
  declarations: [Settings],
  imports: [CommonModule],
  exports: [Settings],
})
export class SettingsModule {}
