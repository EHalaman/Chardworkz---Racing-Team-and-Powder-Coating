import { Component, OnInit, computed, signal } from '@angular/core';
import {
  CATALOGUE_FIGURES,
  CatalogueCategory,
  CatalogueDiagramPart,
  CatalogueFigure,
} from '../catalogue-figures.data';

const ASSETS = 'assets/raider15fi';

export interface CatalogueAngle {
  src: string;
  alt: string;
  label: string;
}

/**
 * Only 6 distinct studio photos exist for the Raider 150 FI (the source folder also has
 * 5.jpg/-3.jpg, which are exact duplicates of -1.jpg/3.jpg respectively) - nowhere near the
 * 24-36+ evenly-spaced turntable frames a real smooth-drag 360 rotation would need. This is
 * a discrete angle stepper over the real photos instead of a fake continuous-rotation illusion.
 */
const ANGLES: CatalogueAngle[] = [
  {
    src: `${ASSETS}/1.jpg`,
    alt: 'Suzuki Raider R150 FI, front-left three-quarter view',
    label: 'Front',
  },
  { src: `${ASSETS}/-1.jpg`, alt: 'Suzuki Raider R150 FI, left side profile', label: 'Left Side' },
  {
    src: `${ASSETS}/-2.jpg`,
    alt: 'Suzuki Raider R150 FI, rear-right three-quarter view',
    label: 'Rear',
  },
  {
    src: `${ASSETS}/4.jpg`,
    alt: 'Suzuki Raider R150 FI, rear-left three-quarter view',
    label: 'Rear (Alt)',
  },
  { src: `${ASSETS}/3.jpg`, alt: 'Suzuki Raider R150 FI, right side profile', label: 'Right Side' },
  {
    src: `${ASSETS}/2.jpg`,
    alt: 'Suzuki Raider R150 FI, rear-right three-quarter view, alternate',
    label: 'Front (Alt)',
  },
];

@Component({
  selector: 'app-catalogue',
  standalone: false,
  styleUrl: './catalogue.scss',
  templateUrl: './catalogue.html',
})
export class Catalogue implements OnInit {
  readonly badgeIcon = `${ASSETS}/badge-360.png`;
  readonly angles: CatalogueAngle[] = ANGLES;
  readonly activeIndex = signal(0);

  readonly categories: ('ALL PARTS' | CatalogueCategory)[] = [
    'ALL PARTS',
    'ENGINE',
    'TRANSMISSION',
    'ELECTRICAL',
    'BODY',
  ];
  readonly figures: CatalogueFigure[] = CATALOGUE_FIGURES;
  readonly activeCategory = signal<'ALL PARTS' | CatalogueCategory>('ALL PARTS');
  readonly filteredFigures = computed(() => {
    const category = this.activeCategory();
    return category === 'ALL PARTS'
      ? this.figures
      : this.figures.filter((figure) => figure.category === category);
  });

  readonly selectedFigure = signal<CatalogueFigure | null>(null);
  readonly diagramSrc = computed(() => this.selectedFigure()?.imageUrl ?? '');
  readonly diagramParts = computed(() => this.selectedFigure()?.diagramParts ?? []);
  readonly activeGroupKey = signal<string | null>(null);

  /** One entry per physical hotspot position, not per table row - a "15.1".."15.19" style
   *  group (see CatalogueDiagramPart's refNo doc) shares one dot on the diagram, so rendering
   *  one button per row would stack N identical buttons exactly on top of each other. */
  readonly hotspotGroups = computed(() => {
    const map = new Map<string, CatalogueDiagramPart[]>();
    for (const part of this.diagramParts()) {
      const key = this.groupKeyOf(part.refNo);
      const group = map.get(key) ?? [];
      group.push(part);
      map.set(key, group);
    }
    return Array.from(map.entries())
      .filter(([, parts]) => parts[0].xRatio !== undefined && parts[0].yRatio !== undefined)
      .map(([groupKey, parts]) => {
        const prices = parts.map((p) => p.price).filter((p): p is number => p !== null);
        const uniquePrices = [...new Set(prices)];
        const priceLabel =
          uniquePrices.length === 0
            ? 'Not listed'
            : uniquePrices.length === 1
              ? `₱ ${uniquePrices[0].toLocaleString('en-PH')}`
              : `₱ ${Math.min(...uniquePrices).toLocaleString('en-PH')}–₱ ${Math.max(...uniquePrices).toLocaleString('en-PH')}`;
        return {
          groupKey,
          xRatio: parts[0].xRatio as number,
          yRatio: parts[0].yRatio as number,
          partName: parts[0].partName,
          priceLabel,
          variantCount: parts.length,
        };
      });
  });

  private dragStartX: number | null = null;
  private readonly SWIPE_THRESHOLD_PX = 40;

  ngOnInit(): void {
    // Preload every angle up front - only 6 small images, cheap - so stepping
    // between them never shows a blank/white flash while the browser fetches.
    for (const angle of this.angles) {
      const img = new Image();
      img.src = angle.src;
    }
  }

  next(): void {
    this.activeIndex.update((i) => (i + 1) % this.angles.length);
  }

  prev(): void {
    this.activeIndex.update((i) => (i - 1 + this.angles.length) % this.angles.length);
  }

  selectIndex(i: number): void {
    this.activeIndex.set(i);
  }

  onTouchStart(event: TouchEvent): void {
    this.dragStartX = event.touches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    this.endDrag(event.changedTouches[0]?.clientX ?? null);
  }

  onMouseDown(event: MouseEvent): void {
    this.dragStartX = event.clientX;
  }

  onMouseUp(event: MouseEvent): void {
    this.endDrag(event.clientX);
  }

  /** Cancels an in-progress drag if the pointer leaves the stage without a mouseup -
   *  otherwise the next mousedown elsewhere would resume from a stale start position. */
  onMouseLeave(): void {
    this.dragStartX = null;
  }

  private endDrag(endX: number | null): void {
    if (this.dragStartX === null) {
      return;
    }
    const start = this.dragStartX;
    this.dragStartX = null;
    if (endX === null) {
      return;
    }
    const deltaX = endX - start;
    if (deltaX > this.SWIPE_THRESHOLD_PX) {
      this.prev();
    } else if (deltaX < -this.SWIPE_THRESHOLD_PX) {
      this.next();
    }
  }

  setCategory(category: 'ALL PARTS' | CatalogueCategory): void {
    this.activeCategory.set(category);
  }

  hasDetail(figure: CatalogueFigure): boolean {
    return !!figure.diagramParts?.length;
  }

  openDetail(figure: CatalogueFigure): void {
    if (this.hasDetail(figure)) {
      this.selectedFigure.set(figure);
      this.activeGroupKey.set(null);
    }
  }

  closeDetail(): void {
    this.selectedFigure.set(null);
    this.activeGroupKey.set(null);
  }

  /** Accepts either a group key ("15") or a full row refNo ("15.7") - both normalize to the
   *  same group, so hovering any one variant row highlights the whole group's hotspot. */
  setActiveGroup(refNo: string | null): void {
    this.activeGroupKey.set(refNo === null ? null : this.groupKeyOf(refNo));
  }

  /** A "15.1" row belongs to group "15" (see CatalogueDiagramPart's refNo doc); a plain "1"
   *  row is its own group. */
  private groupKeyOf(refNo: string): string {
    return refNo.includes('.') ? refNo.split('.')[0] : refNo;
  }

  isRowActive(part: CatalogueDiagramPart): boolean {
    return this.activeGroupKey() === this.groupKeyOf(part.refNo);
  }

  /** Keeps the hotspot tooltip's rendered box within the diagram's own width - a tooltip
   *  centered on a hotspot near the left/right edge (e.g. refNo 1 at xRatio 5) would otherwise
   *  extend past the page's own overflow-x-hidden boundary and get clipped off-screen, especially
   *  on narrow/mobile viewports where the diagram takes up most of the screen width. */
  tooltipClasses(spot: { xRatio: number; yRatio: number }): string {
    const vertical = spot.yRatio < 25 ? 'top-full mt-2' : 'bottom-full mb-2';
    const horizontal =
      spot.xRatio < 20
        ? 'left-0 translate-x-0'
        : spot.xRatio > 80
          ? 'right-0 left-auto translate-x-0'
          : 'left-1/2 -translate-x-1/2';
    return `${vertical} ${horizontal}`;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
