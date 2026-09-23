import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Catalogue } from './catalogue_page/catalogue';

@NgModule({
  declarations: [Catalogue],
  imports: [CommonModule, RouterModule],
  exports: [Catalogue],
})
export class CatalogueModule {}
