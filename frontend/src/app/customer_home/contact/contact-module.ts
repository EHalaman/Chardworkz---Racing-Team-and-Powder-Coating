import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Contact } from './contact_page/contact';

@NgModule({
  declarations: [Contact],
  imports: [CommonModule, RouterModule],
  exports: [Contact],
})
export class ContactModule {}
