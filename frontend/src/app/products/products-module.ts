import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Products } from './products/products';

@NgModule({
  declarations: [Products],
  imports: [CommonModule, RouterModule],
  exports: [Products],
})
export class ProductsModule {}
