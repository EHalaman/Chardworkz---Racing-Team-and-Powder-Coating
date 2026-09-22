import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { CustomerShell } from './customer-shell/customer-shell';

@NgModule({
  declarations: [CustomerShell],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [CustomerShell],
})
export class CustomerShellModule {}
