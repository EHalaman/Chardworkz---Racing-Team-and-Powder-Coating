import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared-module';
import { Home } from './home/home';

@NgModule({
  declarations: [Home],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [Home],
})
export class HomeModule {}
