import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.489D (1-E-9) FRONT BOX (FU150MFX), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-box-fu150mfx-fig-489d-1-e-9/
 * (14 rows, no variant groups, all priced). refNo 9 (BOLT, qty 2) prints twice on the diagram;
 * the clearer occurrence was used, per the RADIATOR_HOSE precedent. xRatio/yRatio measured with
 * the pixel-blob/tight-crop technique in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory), confirmed via direct canvas pixel
 * sampling rather than visual zoom re-inspection - the debug-canvas dots for this figure were
 * too small to reliably distinguish from the line art on a re-zoom, but getImageData confirmed
 * every coordinate landed on its intended canvas pixel.
 */
export const FRONT_BOX_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '92114-12K00-000',
    partName: 'CUSHION,FRONT BOX NO.1',
    qty: 1,
    price: 299,
    xRatio: 11.51,
    yRatio: 55.83,
  },
  {
    refNo: '2',
    partNo: '92115-12K00-000',
    partName: 'CUSHION,FRONT BOX NO.2',
    qty: 1,
    price: 160,
    xRatio: 11.51,
    yRatio: 51.83,
  },
  {
    refNo: '3',
    partNo: '92111-12K00-000',
    partName: 'BOX,FRONT',
    qty: 1,
    price: 357,
    xRatio: 22.09,
    yRatio: 33.42,
  },
  {
    refNo: '4',
    partNo: '92113-12K00-291',
    partName: 'LID,MAINTENANCE (BLACK)',
    qty: 1,
    price: 299,
    xRatio: 11.51,
    yRatio: 34.13,
  },
  {
    refNo: '5',
    partNo: '92121-12K00-YVU',
    partName: 'LID,FRONT BOX OUTER (BLACK)',
    qty: 1,
    price: 567,
    xRatio: 3.98,
    yRatio: 7.72,
  },
  {
    refNo: '6',
    partNo: '92122-12K00-291',
    partName: 'LID,FRONT BOX INNER(BLACK)',
    qty: 1,
    price: 199,
    xRatio: 9.56,
    yRatio: 19.91,
  },
  {
    refNo: '7',
    partNo: '92100-12830-000',
    partName: 'LOCK SET,FRONT BOX',
    qty: 1,
    price: 1195,
    xRatio: 29.46,
    yRatio: 14.52,
  },
  {
    refNo: '8',
    partNo: '92141-12K10-000',
    partName: 'CUSHION,FRONT BOX',
    qty: 1,
    price: 44,
    xRatio: 14.94,
    yRatio: 24.8,
  },
  {
    refNo: '9',
    partNo: '63161-12K00-000',
    partName: 'BOLT (6X14.8)',
    qty: 2,
    price: 36,
    xRatio: 6.73,
    yRatio: 44.39,
  },
  {
    refNo: '10',
    partNo: '09139-06145-000',
    partName: 'SCREW (6X16)',
    qty: 1,
    price: 52,
    xRatio: 30.06,
    yRatio: 31.36,
  },
  {
    refNo: '11',
    partNo: '09409-06341-000',
    partName: 'CLIP (5.9X20.5)',
    qty: 2,
    price: 32,
    xRatio: 58.38,
    yRatio: 27.95,
  },
  {
    refNo: '12',
    partNo: '03541-0412A-000',
    partName: 'SCREW',
    qty: 4,
    price: 30,
    xRatio: 37.85,
    yRatio: 22.87,
  },
  {
    refNo: '13',
    partNo: '68281-12K00-000',
    partName: 'EMBLEM,S',
    qty: 1,
    price: 90,
    xRatio: 18.19,
    yRatio: 30.8,
  },
  {
    refNo: '14',
    partNo: '92116-12K00-000',
    partName: 'TAPE,FRONT BOX PROTECTOR',
    qty: 1,
    price: 50,
    xRatio: 32.72,
    yRatio: 27.95,
  },
];
