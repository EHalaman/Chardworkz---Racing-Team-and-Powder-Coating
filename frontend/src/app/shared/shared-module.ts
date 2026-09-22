import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideHouse, LucideWrench, LucidePackage, LucideMail } from '@lucide/angular';
import { BlueprintHotspot } from './blueprint-hotspot/blueprint-hotspot';
import { Placeholder } from './placeholder/placeholder';
import { FloatingNavRail } from './floating-nav-rail/floating-nav-rail';

@NgModule({
  declarations: [Placeholder, BlueprintHotspot, FloatingNavRail],
  imports: [CommonModule, LucideHouse, LucideWrench, LucidePackage, LucideMail],
  exports: [Placeholder, BlueprintHotspot, FloatingNavRail],
})
export class SharedModule {}
