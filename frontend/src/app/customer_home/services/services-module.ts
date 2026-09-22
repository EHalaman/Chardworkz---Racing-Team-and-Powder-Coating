import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Services } from './service_page/services';

@NgModule({
  declarations: [Services],
  imports: [CommonModule],
  exports: [Services],
})
export class ServicesModule {}
