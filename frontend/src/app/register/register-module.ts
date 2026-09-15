import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Register } from './register/register';

@NgModule({
  declarations: [Register],
  imports: [CommonModule],
  exports: [Register],
})
export class RegisterModule {}
