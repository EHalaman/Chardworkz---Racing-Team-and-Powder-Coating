import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.352B (1-E-4) LOCK SET (FU150RLM5_P3), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-lock-set-fu150rlm5_p3-fig-352b-1-e-4/
 * (11 rows; refNo 1, 2, 4, and 6 have no price on the live site itself - a real gap, not a
 * scraping miss). This is a genuinely different, keyless-start trim variant from the
 * FU150RFM5_P31 basic lock set (FIG.352B under a different URL slug) - real part numbers for a
 * keyless controller/transmitter/indicator system rather than a plain mechanical lock, not a
 * duplicate or mislabeled page. Part name 2 and 11 carry a leading "." exactly as scraped (see
 * AIR_CLEANER_PARTS precedent). xRatio/yRatio measured with the pixel-blob/tight-crop technique
 * in natural-image pixel space (see project_chardworkz_catalogue_schematic_process memory) and
 * dot-overlay verified - all 11 landed on their printed digits on the first verification pass.
 */
export const LOCK_SET_RLM5_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '37101-238A0-000',
    partName: 'LOCK SET',
    qty: 1,
    price: null,
    xRatio: 83.71,
    yRatio: 45.92,
  },
  {
    refNo: '2',
    partNo: '37100-23KA0-000',
    partName: '.LOCK ASSY,STEERING',
    qty: 1,
    price: null,
    xRatio: 60.57,
    yRatio: 45.92,
  },
  {
    refNo: '3',
    partNo: '37152-23KB0-000',
    partName: 'BOLT, STEERING LOCK',
    qty: 2,
    price: 68,
    xRatio: 39.07,
    yRatio: 26.65,
  },
  {
    refNo: '4',
    partNo: '09407-17403-000',
    partName: 'CLAMP (L:170)',
    qty: 1,
    price: null,
    xRatio: 92.93,
    yRatio: 61.65,
  },
  {
    refNo: '5',
    partNo: '37173-23K01-000',
    partName: 'HOLDER, KEYLESS CONTROLLER',
    qty: 1,
    price: 101,
    xRatio: 89.3,
    yRatio: 81.45,
  },
  {
    refNo: '6',
    partNo: '37180-23K70-000',
    partName: 'CONTROLLER ASSY, KEYLESS START',
    qty: 1,
    price: null,
    xRatio: 75.89,
    yRatio: 66.15,
  },
  {
    refNo: '7',
    partNo: '37172-23K32-000',
    partName: '.TRANSMITTER',
    qty: 2,
    price: 7459,
    xRatio: 50.24,
    yRatio: 81.79,
  },
  {
    refNo: '8',
    partNo: '37172-23K32-000',
    partName: 'INDICATOR, KEYLESS',
    qty: 1,
    price: 7459,
    xRatio: 14.65,
    yRatio: 49.41,
  },
  {
    refNo: '9',
    partNo: '37183-23K00-000',
    partName: 'TAPE, KEYLESS INDICATOR',
    qty: 1,
    price: 71,
    xRatio: 18.28,
    yRatio: 45.48,
  },
  {
    refNo: '10',
    partNo: '37155-12811-000',
    partName: 'SHUTTER SET',
    qty: 1,
    price: 1751,
    xRatio: 86.47,
    yRatio: 20.7,
  },
  {
    refNo: '11',
    partNo: '37159-12K00-000',
    partName: '.SCREW, SHUTTER LOCK',
    qty: 1,
    price: 36,
    xRatio: 66.41,
    yRatio: 12.6,
  },
];
