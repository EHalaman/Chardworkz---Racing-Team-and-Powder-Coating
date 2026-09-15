import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Products } from './products/products';

@NgModule({
  declarations: [Products],
  imports: [CommonModule],
  exports: [Products],
})
export class ProductsModule {}
