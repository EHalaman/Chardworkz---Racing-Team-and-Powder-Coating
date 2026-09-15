import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Roles } from './roles/roles';

@NgModule({
  declarations: [Roles],
  imports: [CommonModule],
  exports: [Roles],
})
export class RolesModule {}
