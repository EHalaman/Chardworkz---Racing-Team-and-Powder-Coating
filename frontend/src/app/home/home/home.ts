import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';

interface TextRun {
  text: string;
  bold?: boolean;
}

interface TimelineImage {
  src: string;
  fallback?: string;
  alt: string;
  broken?: boolean;
}

interface TimelineEntry {
  year: string;
  subtitle?: string;
  heading?: string;
  paragraphs?: TextRun[][];
  images: TimelineImage[];
}

interface Sponsor {
  name: string;
  logo: string;
  fallback?: string;
  broken?: boolean;
}

const ASSETS = 'assets/SHOW_CASE_HOMEPAGE';
const RESOURCES = `${ASSETS}/Resources`;
const LOGOS = `${RESOURCES}/LOGOS`;

@Component({
  selector: 'app-home',
  standalone: false,
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements AfterViewInit, OnDestroy {
  // Already includes the logo, Sir Richard, the trophy backdrop, and the #52
  // bike composited in one banner - only the social icon row is drawn on top.
  // Same photo as the old CHARD_WORKZ_HERO.png, re-exported as the "finale" JPG.
  readonly heroBackground = `${RESOURCES}/HERO_BACKGROUND_FINALE.jpg`;

  readonly mobileMenuOpen = signal(false);

  readonly historySummary =
    'Mula sa isang simpleng garahe sa Pintong Bukawe hanggang sa national circuit podium — dokumentado ang 9 taong ebolusyon namin sa Suzuki Raider DOHC engineering.';

  readonly timeline: TimelineEntry[] = [
    {
      year: '2017',
      subtitle: 'Paano Kami Nagsimula',
      heading: 'The Rebuild in Pintong Bukawe',
      paragraphs: [
        [
          { text: 'Noong ' },
          { text: 'Enero 7, 2017', bold: true },
          { text: ', sa tahimik na kalsada ng ' },
          { text: 'Pintong Bukawe, San Mateo, Rizal', bold: true },
          { text: ', nabuo ang isang pangarap mula sa isang kabiguan.' },
        ],
        [
          { text: 'Nagsimula ang lahat nang ipatono ni ' },
          { text: 'Sir Richard Policarpio', bold: true },
          { text: ' ang sarili niyang ' },
          { text: 'Suzuki Raider 150', bold: true },
          {
            text: '. Isang buwan pa lang ang nakalilipas, tumirik at nasira ang makina. Walang formal training sa small engine mechanics si Sir Chard, pero mayroon siyang dalawang bagay na hindi nabibili: matinding pagmamahal sa motor at hindi matitinag na determinasyon.',
          },
        ],
        [
          { text: 'Sa halip na sumuko, kinuha niya ang kanyang camera at tool set. ' },
          {
            text: 'Kumuha siya ng litrato at video sa bawat tinatanggal na bolt, washer, at silyo.',
            bold: true,
          },
          {
            text: ' Sa pamamagitan ng matiyagang self-taught method na ito, inaral niya ang eksaktong galaw ng ',
          },
          { text: 'DOHC 4-valve engine', bold: true },
          {
            text: '. Bawat baklas, inulit. Bawat clearance, tinatantsa nang may absolute precision hanggang sa muling umandar ang makina — mas pino, mas mabilis, at mas matibay kaysa kailanman.',
          },
        ],
      ],
      images: [
        {
          src: `${RESOURCES}/2017_image_1.png`,
          alt: 'Dismantled Suzuki Raider 150 engine parts laid out on a green mat',
        },
        {
          src: `${RESOURCES}/2017_image_2.png`,
          alt: 'The early ChardWorkz shop crew with the first customer motorcycles',
        },
      ],
    },
    {
      year: '2022',
      subtitle: 'Mula Drag Strip Hanggang Sirkuit',
      paragraphs: [
        [
          { text: 'Hindi nagkasya ang ' },
          { text: 'ChardWorkz', bold: true },
          {
            text: ' sa kalsada lang. Sinubok ang matinding tibay at bilis sa drag racing, kung saan microseconds ang labanan sa straight line — pinatunayan naming kayang magluwal ng pinakamabilis na Raider 150 sa paitaas at patag na kalsada.',
          },
        ],
        [
          {
            text: 'Dito rin nagsimulang mabuo ang tunay na formula: ang ',
          },
          { text: 'Suzuki Raider 150 FI', bold: true },
          {
            text: ' na dating pang-araw-araw na sakay, unti-unti nang ginagawang track-bred weapon — may tamang timpla ng horsepower, cornering stability, at bulletproof reliability.',
          },
        ],
      ],
      images: [
        {
          src: `${RESOURCES}/2022.jpg`,
          alt: 'A ChardWorkz mechanic tuning a stripped-down Suzuki Raider drag bike in the paddock',
        },
      ],
    },
    {
      year: '2024',
      subtitle: 'Mga Hari ng Paddock',
      paragraphs: [
        [
          { text: 'Ngunit nang lumabas ang ' },
          { text: 'Suzuki Raider 150 FI', bold: true },
          { text: ', dinala ng ChardWorkz ang hamon sa mas mataas na lebel: ' },
          { text: 'Circuit Racing', bold: true },
          { text: '.' },
        ],
        [
          {
            text: 'Ang straight-line power ay tinalian ng thermal efficiency, cornering stability, at ECU fuel-injection precision. Mula drag strip, nagbago ang rebolusyon patungong mga sikat na race tracks sa bansa.',
          },
        ],
        [
          {
            text: 'Sa likod ng bawat panalo, may barkada ng mga hari ng paddock — pinamumunuan ni ',
          },
          { text: 'Lauren Jay Ewag #52', bold: true },
          {
            text: ', kasalukuyang Points Leader ng ChardWorkz Racing Team sa Underbone Limited 155 at Open Categories sa ',
          },
          { text: 'MotoIR SEC Motosupply', bold: true },
          { text: ' circuit.' },
        ],
      ],
      images: [
        {
          src: `${RESOURCES}/2024_image.png`,
          alt: 'The ChardWorkz team celebrating at the MotoIR SEC Motosupply circuit racing pit lane',
        },
      ],
    },
  ];

  readonly sponsors: Sponsor[] = [
    { name: 'Gille Helmets', logo: `${LOGOS}/GILLEHELMET_LOGO.png` },
    { name: 'BOM Rangsit', logo: `${LOGOS}/BOMRANGSIT_LOGO.png` },
    { name: 'PitsBike', logo: `${LOGOS}/PITSBIKE_LOGO.png` },
    { name: 'VMAX Racing', logo: `${LOGOS}/VMA_LOGO.png` },
    { name: 'JMSeat', logo: `${LOGOS}/JMSEAT_LOGO.png` },
    { name: 'Petronas', logo: `${LOGOS}/PETRONAS_LOGO.png` },
    { name: 'Adelin Philippines', logo: `${LOGOS}/ADELIN_LOGO.png` },
    { name: 'CHC', logo: `${LOGOS}/CHC_LOGO.png` },
    { name: 'Yolac Racing', logo: `${LOGOS}/YOLAC_LOGO.png` },
    { name: 'Imprint Customs', logo: `${LOGOS}/IMPRINT_CUSTOM_LOGO.png` },
    { name: 'Act Dynamis', logo: `${LOGOS}/ACT_DYNAMIS_LOGO.png` },
    { name: 'Quantum Batteries', logo: `${LOGOS}/QUANTUMBATTER_LOGO.png` },
  ];

  readonly activeYear = signal(this.timeline[0].year);

  @ViewChildren('yearNode') private yearNodes!: QueryList<ElementRef<HTMLElement>>;

  /** RxJS-driven smooth anchor navigation, per the hero cards / sidebar / back-to-top link. */
  private readonly scrollTo$ = new Subject<string>();
  private readonly scrollToSub: Subscription;
  private observer?: IntersectionObserver;

  constructor() {
    this.scrollToSub = this.scrollTo$.subscribe((id) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  ngAfterViewInit(): void {
    // Drives the timeline rail's active-year node as the visitor scrolls,
    // rather than a scroll-position calculation re-run on every scroll event.
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        const year = topMost.target.getAttribute('data-year');
        if (year) {
          this.activeYear.set(year);
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: 0 },
    );
    this.yearNodes.forEach((node) => this.observer?.observe(node.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.scrollToSub.unsubscribe();
  }

  goTo(id: string): void {
    this.scrollTo$.next(id);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** Falls back once to a known-working asset, then gives up and shows a CSS placeholder. */
  onImageError(item: { fallback?: string; broken?: boolean }, event: Event): void {
    const img = event.target as HTMLImageElement;
    if (item.fallback && !img.src.endsWith(item.fallback)) {
      img.src = item.fallback;
    } else {
      item.broken = true;
    }
  }
}
