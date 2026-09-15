import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Placeholder } from './placeholder/placeholder';

@NgModule({
  declarations: [Placeholder],
  imports: [CommonModule],
  exports: [Placeholder],
})
export class SharedModule {}
