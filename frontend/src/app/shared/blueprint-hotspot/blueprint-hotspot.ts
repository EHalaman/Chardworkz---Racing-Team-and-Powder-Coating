import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

export interface BlueprintHotspotPart {
  id: number;
  name: string;
  brandTag: string | null;
  unitPrice: number;
  /**
   * Percentage offsets (0-100) from the top-left of the host image, not
   * pixels - keeps pins correctly placed at any rendered image size without
   * the host needing to know the schematic's natural dimensions.
   */
  xPercent: number;
  yPercent: number;
}

/**
 * Reusable exploded-schematic hotspot pin: tap a pin, it springs open into a
 * small preview card anchored above it. No backend/route wiring yet - a
 * future "Raider FI Parts" page supplies imageUrl + hotspots (today nothing
 * in ProductSummary carries an image or schematic coordinates).
 */
@Component({
  selector: 'app-blueprint-hotspot',
  standalone: false,
  styleUrl: './blueprint-hotspot.css',
  templateUrl: './blueprint-hotspot.html',
})
export class BlueprintHotspot {
  @Input() imageUrl = '';
  @Input() imageAlt = 'Exploded parts schematic';
  @Input() hotspots: BlueprintHotspotPart[] = [];
  @Output() partSelected = new EventEmitter<BlueprintHotspotPart>();

  readonly activeId = signal<number | null>(null);

  get activePart(): BlueprintHotspotPart | null {
    const id = this.activeId();
    return id === null ? null : (this.hotspots.find((hotspot) => hotspot.id === id) ?? null);
  }

  togglePin(part: BlueprintHotspotPart): void {
    const isSame = this.activeId() === part.id;
    this.activeId.set(isSame ? null : part.id);
    if (!isSame) {
      this.partSelected.emit(part);
    }
  }

  closeCard(): void {
    this.activeId.set(null);
  }

  trackByHotspotId(_index: number, hotspot: BlueprintHotspotPart): number {
    return hotspot.id;
  }
}
