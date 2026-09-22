import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

const ASSETS = 'assets/SHOW_CASE_HOMEPAGE/SERVICES_PAGE';

export interface RaceUpdate {
  category: string;
  title: string;
  summary: string;
  imageLeftTop: string;
  imageLeftBottom: string;
  imageRight: string;
  ctaText: string;
}

const LATEST_RACE_UPDATE: RaceUpdate = {
  category: '2026 Season — Points Leader',
  title: 'ChardWorkz #52 Leads Underbone Limited 155 & Open Categories',
  summary:
    'Kasama ang roster nina Lauren Jay Ewag (#52), Jhareld Resultay, Renz Pereja, at Evander Soliveres, ang ChardWorkz Racing Team ang kasalukuyang Points Leader sa Underbone Limited 155 at Open Categories ngayong 2026 Season — patunay na iba ang gawang-Pintong Bukawe sa bawat leg ng karera.',
  imageLeftTop: `${ASSETS}/race_update_left_top_image.png`,
  imageLeftBottom: `${ASSETS}/race_update_left_bottom_image.png`,
  imageRight: `${ASSETS}/race_update_right_image.png`,
  ctaText: 'Discover More',
};

/** Non-linear checkpoints the engines counter jumps through before morphing to "Countless" -
 *  gives it a scrambling feel rather than a plain linear count. */
const ENGINES_CHECKPOINTS: { value: number; at: number }[] = [
  { value: 1, at: 0 },
  { value: 45, at: 0.15 },
  { value: 180, at: 0.35 },
  { value: 420, at: 0.55 },
  { value: 890, at: 0.75 },
  { value: 999, at: 1 },
];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function engineScrambleValue(progress: number): number {
  for (let i = 0; i < ENGINES_CHECKPOINTS.length - 1; i++) {
    const from = ENGINES_CHECKPOINTS[i];
    const to = ENGINES_CHECKPOINTS[i + 1];
    if (progress <= to.at) {
      const segmentT = (progress - from.at) / (to.at - from.at);
      return Math.round(from.value + (to.value - from.value) * segmentT);
    }
  }
  return ENGINES_CHECKPOINTS[ENGINES_CHECKPOINTS.length - 1].value;
}

export interface ServiceOffer {
  id: string;
  title: string;
  materialsNeeded: string;
  purpose: string;
}

const SERVICE_OFFERS: ServiceOffer[] = [
  {
    id: '01',
    title: 'Drive Chain & Sprocket Replacement',
    materialsNeeded: '1x sgp chain & sprocket kit (14t/38t/116l)',
    purpose:
      'restores direct power delivery from the transmission output shaft to the rear wheel while eliminating driveline slop and chain noise.',
  },
  {
    id: '02',
    title: 'Engine Oil & Filter Service',
    materialsNeeded: '1.3l suzuki ecstar r9000 10w-40 full synthetic 4t oil',
    purpose:
      'maintains vital engine lubrication, reduces friction across the dohc valvetrain, and flushes internal engine contaminants.',
  },
  {
    id: '03',
    title: 'Cylinder Head Top-Overhaul & Carbon Cleaning',
    materialsNeeded: 'sgp valve stem seals & tappet adjusting shims',
    purpose:
      'removes combustion chamber carbon crust, laps intake/exhaust valves to a leak-free seal, and sets precise dohc shim clearances.',
  },
  {
    id: '04',
    title: 'Front Fork Re-fluid & Seal Overhaul',
    materialsNeeded: '400ml suzuki ecstar fork oil (sae 10w)',
    purpose:
      'cures stanchion oil leaks, restores front fork hydraulic damping, and maintains front-end stability under hard braking.',
  },
  {
    id: '05',
    title: 'Throttle Body Service & Ultrasonic Injector Cleaning',
    materialsNeeded: 'sgp throttle body & fuel injector o-ring set',
    purpose:
      'cleans sticky varnish from the throttle plate, clears micro-clogs in the fuel injector nozzle, and stabilizes rough idle rpm.',
  },
  {
    id: '06',
    title: 'Clutch System Renewal',
    materialsNeeded: '5x sgp friction plates & heavy-duty clutch springs',
    purpose:
      'eliminates high-rpm clutch slippage, restores sharp gear engagement, and prevents power loss during heavy loads.',
  },
];

@Component({
  selector: 'app-services',
  standalone: false,
  styleUrl: './services.scss',
  templateUrl: './services.html',
})
export class Services implements AfterViewInit, OnDestroy {
  readonly heroBackground = `${ASSETS}/HERO-background.png`;
  readonly serviceOffers: ServiceOffer[] = SERVICE_OFFERS;
  readonly latestRaceUpdate: RaceUpdate = LATEST_RACE_UPDATE;

  readonly yearsDisplay = signal('0');
  readonly trophiesDisplay = signal('0');
  readonly enginesDisplay = signal('1');
  readonly enginesMorphing = signal(false);

  @ViewChild('statsSection') private statsSectionRef?: ElementRef<HTMLElement>;

  private statsObserver: IntersectionObserver | null = null;
  private hasAnimatedStats = false;
  private yearsRafId: number | null = null;
  private trophiesRafId: number | null = null;
  private enginesRafId: number | null = null;
  private enginesMorphTimeoutId: number | null = null;

  constructor(private readonly ngZone: NgZone) {}

  ngAfterViewInit(): void {
    const el = this.statsSectionRef?.nativeElement;
    if (!el) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.statsObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !this.hasAnimatedStats) {
            this.hasAnimatedStats = true;
            this.statsObserver?.disconnect();
            this.runStatsAnimation();
          }
        },
        { threshold: 0.3 },
      );
      this.statsObserver.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    if (this.yearsRafId !== null) {
      cancelAnimationFrame(this.yearsRafId);
    }
    if (this.trophiesRafId !== null) {
      cancelAnimationFrame(this.trophiesRafId);
    }
    if (this.enginesRafId !== null) {
      cancelAnimationFrame(this.enginesRafId);
    }
    if (this.enginesMorphTimeoutId !== null) {
      clearTimeout(this.enginesMorphTimeoutId);
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Runs entirely outside Angular's zone; each tick's signal write is the only piece
   *  re-entering it, so change detection only fires on actual value changes, not every frame. */
  private runStatsAnimation(): void {
    this.animate(
      1500,
      (progress) => {
        const value = Math.round(easeOutCubic(progress) * 9);
        this.ngZone.run(() => this.yearsDisplay.set(progress >= 1 ? '9+' : String(value)));
      },
      (id) => (this.yearsRafId = id),
    );

    this.animate(
      2000,
      (progress) => {
        const value = Math.round(easeOutCubic(progress) * 200);
        this.ngZone.run(() => this.trophiesDisplay.set(progress >= 1 ? '200+' : String(value)));
      },
      (id) => (this.trophiesRafId = id),
    );

    this.animate(
      2200,
      (progress) => {
        this.ngZone.run(() => this.enginesDisplay.set(String(engineScrambleValue(progress))));
      },
      (id) => (this.enginesRafId = id),
      () => this.morphEnginesToCountless(),
    );
  }

  private morphEnginesToCountless(): void {
    this.ngZone.run(() => this.enginesMorphing.set(true));
    this.enginesMorphTimeoutId = window.setTimeout(() => {
      this.ngZone.run(() => {
        this.enginesDisplay.set('Countless');
        this.enginesMorphing.set(false);
      });
    }, 220);
  }

  private animate(
    durationMs: number,
    onTick: (progress: number) => void,
    setRafId: (id: number) => void,
    onComplete?: () => void,
  ): void {
    const start = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / durationMs);
      onTick(progress);
      if (progress < 1) {
        setRafId(requestAnimationFrame(step));
      } else {
        onComplete?.();
      }
    };
    setRafId(requestAnimationFrame(step));
  }
}
