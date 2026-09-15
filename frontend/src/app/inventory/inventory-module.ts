import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Inventory } from './inventory/inventory';

@NgModule({
  declarations: [Inventory],
  imports: [CommonModule],
  exports: [Inventory],
})
export class InventoryModule {}
