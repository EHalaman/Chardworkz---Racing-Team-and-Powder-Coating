import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.460D (1-D-16) FRONT FENDER (FU150MFX), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-fender-fu150mfx-fig-460d-1-d-16/
 * (5 rows: 4 diagram positions plus a 2-way color-variant group refNo "1.1"/"1.2" (BLACK/RED)
 * sharing the diagram's single printed "1" callout and xRatio/yRatio, per the FRAME_COVER
 * precedent). xRatio/yRatio measured by direct dark-pixel cluster scanning on the canvas
 * ImageData in natural-image pixel space (see project_chardworkz_catalogue_schematic_process
 * memory) - an initial eyeballed grid-label read for refNo 2/3 was off by ~30-70px (confirmed
 * blank/white nearby on pixel re-check), corrected via centroid-of-dark-pixels scanning.
 */
export const FRONT_FENDER_MFX_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1.1',
    partNo: '53111-12K00-YVU',
    partName: 'FENDER,FRONT (BLACK)',
    qty: 1,
    price: 1149,
    xRatio: 46.34,
    yRatio: 35.65,
  },
  {
    refNo: '1.2',
    partNo: '',
    partName: 'FENDER,FRONT (RED)',
    qty: 1,
    price: 1149,
    xRatio: 46.34,
    yRatio: 35.65,
  },
  {
    refNo: '2',
    partNo: '01547-0610A-000',
    partName: 'BOLT',
    qty: 2,
    price: 32,
    xRatio: 65.47,
    yRatio: 60.02,
  },
  {
    refNo: '3',
    partNo: '09139-06145-000',
    partName: 'SCREW (6X16)',
    qty: 2,
    price: 52,
    xRatio: 62.33,
    yRatio: 52.99,
  },
  {
    refNo: '4',
    partNo: '09169-06053-000',
    partName: 'WASHER',
    qty: 2,
    price: 60,
    xRatio: 68.61,
    yRatio: 62.04,
  },
];
