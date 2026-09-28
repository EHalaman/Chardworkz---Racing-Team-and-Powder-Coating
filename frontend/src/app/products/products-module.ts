import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared-module';
import { Products } from './products/products';

@NgModule({
  declarations: [Products],
  imports: [CommonModule, RouterModule, SharedModule],
  exports: [Products],
})
export class ProductsModule {}
