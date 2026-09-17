import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlueprintHotspot } from './blueprint-hotspot/blueprint-hotspot';
import { Placeholder } from './placeholder/placeholder';

@NgModule({
  declarations: [Placeholder, BlueprintHotspot],
  imports: [CommonModule],
  exports: [Placeholder, BlueprintHotspot],
})
export class SharedModule {}
