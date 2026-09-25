import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.460H (1-E-2) FRONT FENDER (FU150MFZ), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-fender-fu150mfz-fig-460h-1-e-2/
 * (4 rows, no variant groups, all priced; single BLACK-only fender, unlike the MFX sibling
 * figure's black/red pair). xRatio/yRatio measured by direct dark-pixel cluster scanning on the
 * canvas ImageData in natural-image pixel space rather than eyeballed grid-label reading - a
 * manual grid read on this figure was off by ~20-40px on three of the four positions, caught by
 * cross-checking against actual pixel darkness at each candidate point (see
 * project_chardworkz_catalogue_schematic_process memory for the updated technique).
 */
export const FRONT_FENDER_MFZ_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '53111-12K00-YVU',
    partName: 'FENDER,FRONT (BLACK)',
    qty: 1,
    price: 1149,
    xRatio: 47.24,
    yRatio: 35.94,
  },
  {
    refNo: '2',
    partNo: '01547-0610A-000',
    partName: 'BOLT',
    qty: 2,
    price: 32,
    xRatio: 64.42,
    yRatio: 58.96,
  },
  {
    refNo: '3',
    partNo: '09139-06145-000',
    partName: 'SCREW (6X16)',
    qty: 2,
    price: 52,
    xRatio: 61.88,
    yRatio: 53.18,
  },
  {
    refNo: '4',
    partNo: '09169-06053-000',
    partName: 'WASHER',
    qty: 2,
    price: 60,
    xRatio: 68.76,
    yRatio: 62.14,
  },
];
