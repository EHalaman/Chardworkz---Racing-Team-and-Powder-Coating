import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { Login } from './login/login';

@NgModule({
  declarations: [Login],
  imports: [CommonModule, SharedModule],
  exports: [Login],
})
export class AuthModule {}
