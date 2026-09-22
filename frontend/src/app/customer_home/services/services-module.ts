import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Services } from './service_page/services';

@NgModule({
  declarations: [Services],
  imports: [CommonModule, RouterModule],
  exports: [Services],
})
export class ServicesModule {}
