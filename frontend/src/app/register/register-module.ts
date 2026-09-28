import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { Register } from './register/register';

@NgModule({
  declarations: [Register],
  imports: [CommonModule, SharedModule],
  exports: [Register],
})
export class RegisterModule {}
