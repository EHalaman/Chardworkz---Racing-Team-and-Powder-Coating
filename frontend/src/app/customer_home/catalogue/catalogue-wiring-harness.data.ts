import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.350A (1-D-14) WIRING HARNESS (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-wiring-harness-fu150rfm5_p31-fig-350a-1-d-14/
 * (12 rows, no variant groups; refNo 5 has no price on the live site itself - a real gap, not a
 * scraping miss). refNo 10 and 11 are two separate table rows for the SAME part number and part
 * name (RELAY ASSY,MAIN, 38860-33J00-000) but the diagram itself prints a single combined
 * "10-11" callout at one position - both rows share that one xRatio/yRatio here, matching how
 * hotspotGroups() in catalogue.ts dedupes by position (see also CLUTCH's "7"/"7.2" mismatched-
 * label precedent). xRatio/yRatio measured with the pixel-blob/tight-crop technique in
 * natural-image pixel space (see project_chardworkz_catalogue_schematic_process memory) and
 * dot-overlay verified.
 */
export const WIRING_HARNESS_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '36610-12K21-000',
    partName: 'HARNESS,WIRING',
    qty: 1,
    price: 7342,
    xRatio: 69.85,
    yRatio: 20.36,
  },
  {
    refNo: '2',
    partNo: '09481-10501-000',
    partName: 'FUSE (10A)',
    qty: 2,
    price: 64,
    xRatio: 72.66,
    yRatio: 24.32,
  },
  {
    refNo: '3',
    partNo: '09481-15501-000',
    partName: 'FUSE (15A)',
    qty: 4,
    price: 64,
    xRatio: 69.3,
    yRatio: 24.32,
  },
  {
    refNo: '4',
    partNo: '36990-25G10-000',
    partName: 'CLAMP, WIRING HARNESS',
    qty: 1,
    price: 36,
    xRatio: 92.21,
    yRatio: 14.41,
  },
  {
    refNo: '5',
    partNo: '09407-17403-000',
    partName: 'CLAMP (L:170)',
    qty: 2,
    price: null,
    xRatio: 83.84,
    yRatio: 11.71,
  },
  {
    refNo: '6',
    partNo: '37740-12K00-000',
    partName: 'SWITCH ASSY,STOP LAMP',
    qty: 1,
    price: 173,
    xRatio: 81.05,
    yRatio: 72.93,
  },
  {
    refNo: '7',
    partNo: '09443-06090-000',
    partName: 'SPRING',
    qty: 1,
    price: 40,
    xRatio: 81.05,
    yRatio: 81.03,
  },
  {
    refNo: '8',
    partNo: '38500-12K00-000',
    partName: 'HORN ASSY',
    qty: 1,
    price: 486,
    xRatio: 48.9,
    yRatio: 82.82,
  },
  {
    refNo: '9',
    partNo: '01550-0616A-000',
    partName: 'BOLT',
    qty: 1,
    price: 63,
    xRatio: 39.14,
    yRatio: 76.53,
  },
  {
    refNo: '10',
    partNo: '38860-33J00-000',
    partName: 'RELAY ASSY,MAIN',
    qty: 1,
    price: 285,
    xRatio: 95.06,
    yRatio: 62.13,
  },
  {
    refNo: '11',
    partNo: '38860-33J00-000',
    partName: 'RELAY ASSY,MAIN',
    qty: 1,
    price: 285,
    xRatio: 95.06,
    yRatio: 62.13,
  },
  {
    refNo: '12',
    partNo: '92274-12K00-000',
    partName: 'RUBBER,CUSHION BATTERY',
    qty: 1,
    price: 44,
    xRatio: 53.76,
    yRatio: 28.81,
  },
];
