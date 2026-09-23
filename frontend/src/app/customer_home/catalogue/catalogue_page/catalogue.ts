import { Component, OnInit, computed, signal } from '@angular/core';
import { CATALOGUE_FIGURES, CatalogueCategory, CatalogueFigure } from '../catalogue-figures.data';
import {
  CYLINDER_HEAD_COVER_DIAGRAM,
  CYLINDER_HEAD_COVER_PARTS,
  CylinderHeadCoverPart,
} from '../catalogue-cylinder-head-cover.data';

/** The one figure with a real verified diagram+parts breakdown today - matched by title
 *  against catalogue-figures.data.ts so its card can open the detail view. */
const DETAIL_FIGURE_TITLE = 'CYLINDER HEAD COVER';

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

  readonly diagramSrc = CYLINDER_HEAD_COVER_DIAGRAM;
  readonly diagramParts: CylinderHeadCoverPart[] = CYLINDER_HEAD_COVER_PARTS;
  readonly selectedFigure = signal<CatalogueFigure | null>(null);
  readonly activeRefNo = signal<number | null>(null);

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
    return figure.title === DETAIL_FIGURE_TITLE;
  }

  openDetail(figure: CatalogueFigure): void {
    if (this.hasDetail(figure)) {
      this.selectedFigure.set(figure);
      this.activeRefNo.set(null);
    }
  }

  closeDetail(): void {
    this.selectedFigure.set(null);
    this.activeRefNo.set(null);
  }

  setActiveRef(refNo: number | null): void {
    this.activeRefNo.set(refNo);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
