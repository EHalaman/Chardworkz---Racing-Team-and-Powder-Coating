import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { Roles } from './roles/roles';

@NgModule({
  declarations: [Roles],
  imports: [CommonModule, SharedModule],
  exports: [Roles],
})
export class RolesModule {}
