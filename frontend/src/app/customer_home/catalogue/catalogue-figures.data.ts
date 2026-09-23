import { CYLINDER_HEAD_COVER_PARTS } from './catalogue-cylinder-head-cover.data';
import { AIR_CLEANER_PARTS } from './catalogue-air-cleaner.data';
import { CAMSHAFT_VALVE_PARTS } from './catalogue-camshaft-valve.data';
import { CRANK_BALANCER_PARTS } from './catalogue-crank-balancer.data';

export type CatalogueCategory = 'ENGINE' | 'TRANSMISSION' | 'ELECTRICAL' | 'BODY';

/** One real, verified part row + its hotspot position on a figure's own diagram image.
 *  xRatio/yRatio must be measured against that image's own printed lead-line number (see
 *  the pixel-centroid technique documented in catalogue-cylinder-head-cover.data.ts), never
 *  guessed - a figure with real prices/part numbers but guessed coordinates is worse than no
 *  detail view at all, since it would misplace every callout.
 *
 *  refNo is a string, not a number, because Suzuki PH's own tables group size/spec variants of
 *  the same physical position under one printed diagram number with sub-indices - e.g. FIG.126A
 *  CAMSHAFT/VALVE's "15.1".."15.19" are 19 different tappet-shim thicknesses that all share the
 *  diagram's single printed "15" callout. Every "N.M" row must carry the exact same xRatio/yRatio
 *  as its group (see hotspotGroups() in catalogue.ts, which dedupes by position for rendering
 *  one hotspot per group instead of one per row). A plain "N" row (no dot) is its own group. */
export interface CatalogueDiagramPart {
  refNo: string;
  partNo: string;
  partName: string;
  qty: number;
  /** null when the live Suzuki PH page itself shows no price for this part (a real gap on
   *  their site, not a scraping miss) - never 0, which would wrongly imply the part is free. */
  price: number | null;
  /** Undefined for a row that's real (scraped from the live parts table) but has no printed
   *  position on the diagram itself - e.g. a bulk "SHIM SET" kit or a special service tool
   *  (SST), neither of which is a physical component shown in the exploded view. Such a row
   *  still appears in the parts table for completeness, it just never gets a hotspot dot. */
  xRatio?: number; // % X offset on the diagram image
  yRatio?: number; // % Y offset on the diagram image
}

export interface CatalogueFigure {
  category: CatalogueCategory;
  figCode: string;
  title: string;
  href: string;
  /** Real hotlinked Suzuki PH diagram image, verified per-figure - only set once a figure's
   *  own page has actually been checked (see catalogue-cylinder-head-cover.data.ts). Left
   *  undefined for the other figures rather than guessing a URL, since the image filenames
   *  don't follow a pattern derivable from the title/code (no shortcut - each one would need
   *  visiting that figure's own page). Cards fall back to a placeholder icon when unset. */
  imageUrl?: string;
  /** Real per-part breakdown with verified hotspot coordinates - only set once a figure has
   *  been through the full verification process (see catalogue-cylinder-head-cover.data.ts).
   *  A card only gets "Inspect Diagram" once this is populated; otherwise it correctly stays
   *  "View on Suzuki PH" link-out-only rather than showing a fabricated detail view. */
  diagramParts?: CatalogueDiagramPart[];
}

const SUZUKI_PH_BASE = 'https://mc.suzuki.com.ph/figure-part/';

/**
 * Real figure/diagram listing for the Raider R150 FI, scraped live from Suzuki Philippines'
 * own genuine-parts catalogue (mc.suzuki.com.ph/genuine-part/raider-r150-fi/, ENGINE /
 * TRANSMISSION / ELECTRICAL / BODY tabs) rather than the older 2016 PDF catalogue used
 * elsewhere in this project (Raider150FI_EnginesBodyParts_FullPartsList.csv) - the live site
 * is the authoritative, current source and doesn't always agree with that older PDF (see
 * DECISIONS.md DEC-076 for a documented case of the same drift on OEM part numbers).
 * A few titles/codes below are exactly as shown on the live site, including its own real
 * inconsistencies (e.g. MUFFLER's displayed code (1-C-2) doesn't match its URL slug's
 * (1-b-15); ELECTRICAL's FIG.312A entry has no real title on the site itself).
 */
export const CATALOGUE_FIGURES: CatalogueFigure[] = [
  // ENGINE (18)
  {
    category: 'ENGINE',
    figCode: 'FIG.102A (1-B-2)',
    title: 'CYLINDER HEAD COVER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-cylinder-head-cover-fig-102a-1-b-2/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0011.jpg',
    diagramParts: CYLINDER_HEAD_COVER_PARTS,
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.155A (1-B-14)',
    title: 'AIR CLEANER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-air-cleaner-fig-155a-1-b-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0023.jpg',
    diagramParts: AIR_CLEANER_PARTS,
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.126A (1-B-10)',
    title: 'CAMSHAFT/VALVE',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-camshaft-valve-fig-126a-1-b-10/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0019.jpg',
    diagramParts: CAMSHAFT_VALVE_PARTS,
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.124A (1-B-9)',
    title: 'CRANK BALANCER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-crank-balancer-fig-124a-1-b-9/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0018.jpg',
    diagramParts: CRANK_BALANCER_PARTS,
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.112A (1-B-6)',
    title: 'CRANKCASE COVER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-crankcase-cover-fig-112a-1-b-6/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0015.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.108A (1-B-5)',
    title: 'CRANKCASE',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-crankcase-fig-108a-1-b-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0014.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.120A (1-B-7)',
    title: 'CRANKSHAFT',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-crankshaft-fig-120a-1-b-7/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0016.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.107A (1-B-4)',
    title: 'CYLINDER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-cylinder-fig-107a-1-b-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0013.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.103A (1-B-3)',
    title: 'CYLINDER HEAD',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-cylinder-head-fig-103a-1-b-3/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0012.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.163A (1-C-2)',
    title: 'MUFFLER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-muffler-fig-163a-1-b-15/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0028.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.170A (1-B-16)',
    title: 'OIL PUMP',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-oil-pump-fig-170a-1-c-3/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0025.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.185A (1-C-4)',
    title: 'RADIATOR',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-radiator-fig-185a-1-c-6/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0032.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.187A (1-C-5)',
    title: 'RADIATOR HOSE',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-radiator-hose-fig-187a-1-c-7/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0033.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.122A (1-B-8)',
    title: 'STARTER CLUTCH',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-starter-clutch-fig-122a-1-b-8/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0017.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.140A (1-B-13)',
    title: 'THROTTLE BODY',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-throttle-body-fig-140a-1-b-13/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0022.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.180A (1-C-3)',
    title: 'WATER PUMP',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-water-pump-fig-180a-1-c-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0027.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.127A (1-B-12)',
    title: 'CAM CHAIN',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-cam-chain-fig-127a-1-b-12/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2025/03/FU150MFXM4_P311st-Edition_page-0022-new.jpg',
  },
  {
    category: 'ENGINE',
    figCode: 'FIG.462A (1-E-8)',
    title: 'HANDLEBAR',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-handlebar-fig-462a-1-e-8/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2025/03/FU150MFXM4_P311st-Edition_page-0057-new-image.jpg',
  },

  // TRANSMISSION (4)
  {
    category: 'TRANSMISSION',
    figCode: 'FIG.201A (1-C-8)',
    title: 'CLUTCH',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-clutch-fig-201a-1-c-9/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150RF-RLM5_P31FINAL_page-0035.jpg',
  },
  {
    category: 'TRANSMISSION',
    figCode: 'FIG.212A (1-C-12)',
    title: 'GEAR SHIFTING (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-gear-shifting-fig-212a-1-c-12/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0033.jpg',
  },
  {
    category: 'TRANSMISSION',
    figCode: 'FIG.240A (1-C-11)',
    title: 'KICK STARTER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-kick-starter-fig-240a-1-c-11/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0035.jpg',
  },
  {
    category: 'TRANSMISSION',
    figCode: 'FIG.206A (1-C-10)',
    title: 'TRANSMISSION',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-transmission-fig-206a-1-c-10/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0031.jpg',
  },

  // ELECTRICAL (14)
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.310A (1-D-3)',
    title: 'BATTERY (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-battery-fig-310d-1-c-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0042.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.312A (1-D-5)',
    title: 'ELECTRICAL (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-electrical-fu150rfm5_p31-fig-312a-1-d-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0044.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.172A (1-C-2)',
    title: 'FUEL PUMP',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-fuel-pump-fig-172a-1-c-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0026.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.355A (1-E-5)',
    title: 'HANDLE SWITCH (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-handle-switch-fu150rfm5_p31-fig-355a-1-e-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0057.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.333A (1-D-9)',
    title: 'HEADLAMP (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-headlamp-fig-333a-1-d-9/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0041.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.352B (1-E-4)',
    title: 'LOCK SET (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-lock-set-fu150rlm5_p31-fig-352b-1-e-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0055.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.303A (1-C-13)',
    title: 'MAGNETO',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-magneto-fig-303a-1-c-13/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0037.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.339A (1-D-13)',
    title: 'REAR COMBINATION LAMP',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-combination-lamp-fig-339a-1-d-3/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150RF-RLM5_P31FINAL_page-0052.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.330A (1-D-7)',
    title: 'SPEEDOMETER (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-speedometer-fu150rfm5_p31-fig-330a-1-d-7/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0040.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.301A (1-C-14)',
    title: 'STARTING MOTOR',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-starting-motor-fig-301a-1-c-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0036.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.350A (1-D-14)',
    title: 'WIRING HARNESS (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-wiring-harness-fu150rfm5_p31-fig-350a-1-d-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0053.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.333B (1-D-10)',
    title: 'HEADLAMP (FU150RLM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-headlamp-fig-333b-1-d-10-fu150rlm5_p31/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2026/01/FU150RF-RLM5_P31FINAL_page-0049.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.355B (1-E-6)',
    title: 'HANDLE SWITCH (FU150RLM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-handle-switch-fu150rlm5_p31-fig-355b-1-e-6/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2026/01/FU150RF-RLM5_P31FINAL_page-0058.jpg',
  },
  {
    category: 'ELECTRICAL',
    figCode: 'FIG.352B (1-E-4)',
    title: 'LOCK SET (FU150RLM5_P3)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-lock-set-fu150rlm5_p3-fig-352b-1-e-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2026/01/FU150RF-RLM5_P31FINAL_page-0056.jpg',
  },

  // BODY (25)
  {
    category: 'BODY',
    figCode: 'FIG.415A (1-D-10)',
    title: 'FOOTREST',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-footrest-fig-415a-1-d-10/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0049.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.445A (1-E-14)',
    title: 'FRAME COVER (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-frame-cover-fu150rfm5_p31-fig-445a-1-e-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0066.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.401A (1-E-7)',
    title: 'FRAME (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-frame-fu150rfm5_p31-fig-401a-1-e-7/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150RF-RLM5_P31FINAL_page-0059.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.489D (1-E-9)',
    title: 'FRONT BOX (FU150MFX)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-box-fu150mfx-fig-489d-1-e-9/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0063.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.536A (1-F-3)',
    title: 'FRONT BRAKE HOSE',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-brake-hose-fig-536a-1-f-3/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0072.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.535A (1-F-2)',
    title: 'FRONT CALIPER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-caliper-fig-535a-1-f-2/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0071.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.460D (1-D-16)',
    title: 'FRONT FENDER (FU150MFX)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-fender-fu150mfx-fig-460d-1-d-16/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0055.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.460H (1-E-2)',
    title: 'FRONT FENDER (FU150MFZ)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-fender-fu150mfz-fig-460h-1-e-2/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0056.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.521A (1-E-13) & (1-E-14)',
    title: 'FRONT FORK DAMPER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-fork-damper-fig-521a-1-e-13-1-e-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0067.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.537A (1-F-4)',
    title: 'FRONT MASTER CYLINDER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-master-cylinder-fig-537a-1-f-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0073.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.530D (1-E-16)',
    title: 'FRONT WHEEL',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-front-wheel-fig-530d-1-e-16/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0070.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.420A (1-E-12)',
    title: 'FUEL TANK (FU150RFM5_P31)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-fuel-tank-fu150rfm5_p31-fig-420a-1-e-12/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0050.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.467A (1-E-4)',
    title: 'HANDLE LEVER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-handle-lever-fig-467a-1-e-4/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0058.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.451E (1-D-14)',
    title: 'HEADLAMP HOUSING (FU150MFX)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-headlamp-housing-fu150mfx-fig-451e-1-d-14/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0053.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.496E (1-E-11)',
    title: 'LABEL',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-label-fig-496e-1-e-11/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0065.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.410A (1-D-9)',
    title: 'PILLION RIDER HANDLE',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-pillion-rider-handle-fig-410a-1-d-9/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0048.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.555A (1-F-7)',
    title: 'REAR CALIPER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-caliper-fig-555a-1-f-7/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0076.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.474A (1-E-5)',
    title: 'REAR FENDER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-fender-fig-474a-1-e-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0059.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.558A (1-F-8)',
    title: 'REAR MASTER CYLINDER',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-master-cylinder-fig-558a-1-f-8/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0077.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.541A (1-F-5)',
    title: 'REAR SWINGING ARM',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-swinging-arm-fig-541a-1-f-5/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0074.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.550D (1-F-6)',
    title: 'REAR WHEEL',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-rear-wheel-fig-550d-1-f-6/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0075.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.505A (1-E-12)',
    title: 'SEAT',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-seat-fig-505a-1-e-12/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0066.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.407A (1-D-8)',
    title: 'STAND',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-stand-fig-407a-1-d-8/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0047.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.524A (1-E-15)',
    title: 'STEERING STEM',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-steering-stem-fig-524a-1-e-15/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0069.jpg',
  },
  {
    category: 'BODY',
    figCode: 'FIG.483D (1-E-6) & (1-E-7)',
    title: 'UNDER COWLING (FU150MFX)',
    href: SUZUKI_PH_BASE + 'raider-r150-fi-under-cowling-fu150mfx-fig-483d-1-e-6/',
    imageUrl:
      'https://mc.suzuki.com.ph/wp-content/uploads/2024/10/FU150MFXM3_P31Final_page-0060.jpg',
  },
];
