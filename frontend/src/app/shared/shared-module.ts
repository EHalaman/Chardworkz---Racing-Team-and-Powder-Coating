import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideHouse, LucideWrench, LucidePackage, LucideMail } from '@lucide/angular';
import { BlueprintHotspot } from './blueprint-hotspot/blueprint-hotspot';
import { Placeholder } from './placeholder/placeholder';
import { FloatingNavRail } from './floating-nav-rail/floating-nav-rail';
import { DateRangePicker } from './date-range-picker/date-range-picker';
import { PasswordInput } from './password-input/password-input';
import { SearchableCombobox } from './searchable-combobox/searchable-combobox';
import { ReceiptModal } from './receipt-modal/receipt-modal';

@NgModule({
  declarations: [
    Placeholder,
    BlueprintHotspot,
    FloatingNavRail,
    DateRangePicker,
    PasswordInput,
    SearchableCombobox,
    ReceiptModal,
  ],
  imports: [CommonModule, LucideHouse, LucideWrench, LucidePackage, LucideMail],
  exports: [
    Placeholder,
    BlueprintHotspot,
    FloatingNavRail,
    DateRangePicker,
    PasswordInput,
    SearchableCombobox,
    ReceiptModal,
  ],
})
export class SharedModule {}
