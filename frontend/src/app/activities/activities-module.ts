import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activities } from './activities/activities';

@NgModule({
  declarations: [Activities],
  imports: [CommonModule],
  exports: [Activities],
})
export class ActivitiesModule {}
