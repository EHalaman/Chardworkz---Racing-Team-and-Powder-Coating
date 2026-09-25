import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.407A (1-D-8) STAND, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-stand-fig-407a-1-d-8/
 * (parts table + diagram image, which covers the center stand, prop stand, and the brake pedal
 * assembly together). xRatio/yRatio measured with the Node/Jimp pixel-centroid pipeline (see
 * catalogue-pillion-rider-handle.data.ts). refNo 6's estimate initially landed on the spring
 * coil itself (whose tightly-wound loops produce several digit-sized dark blobs that pass the
 * glyph filter) rather than its printed digit, and refNo 13's first-pass top candidate was the
 * same kind of false positive from a different spring; both were resolved the same way as the
 * recurring spring/bolt-thread/circle-detail false-positive cases in the other files in this set
 * - crop wider, find the real digit visually, re-scope on the corrected position.
 */
export const STAND_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '42100-12K00-000',
    partName: 'STAND,CENTER',
    qty: 1,
    price: 4038,
    xRatio: 41,
    yRatio: 53,
  },
  {
    refNo: '2',
    partNo: '42211-25G00-000',
    partName: 'SHAFT,CENTER STAND',
    qty: 1,
    price: 273,
    xRatio: 59,
    yRatio: 57,
  },
  {
    refNo: '3',
    partNo: '04111-3025A-000',
    partName: 'PIN',
    qty: 1,
    price: 28,
    xRatio: 29,
    yRatio: 37,
  },
  {
    refNo: '4',
    partNo: '08322-0116A-000',
    partName: 'WASHER',
    qty: 1,
    price: 55,
    xRatio: 32,
    yRatio: 38,
  },
  {
    refNo: '5',
    partNo: '42272-09G00-000',
    partName: 'CUSHION,CTR STAND',
    qty: 1,
    price: 38,
    xRatio: 34,
    yRatio: 53,
  },
  {
    refNo: '6',
    partNo: '42241-45H00-000',
    partName: 'SPRING,CTR STAND',
    qty: 1,
    price: 105,
    xRatio: 73,
    yRatio: 55,
  },
  {
    refNo: '7',
    partNo: '42310-12K00-000',
    partName: 'STAND,PROP',
    qty: 1,
    price: 320,
    xRatio: 54,
    yRatio: 78,
  },
  {
    refNo: '8',
    partNo: '09443-14077-000',
    partName: 'SPRING',
    qty: 1,
    price: 51,
    xRatio: 56,
    yRatio: 64,
  },
  {
    refNo: '9',
    partNo: '42341-25G20-000',
    partName: 'BOLT,PROP STAND',
    qty: 1,
    price: 52,
    xRatio: 45,
    yRatio: 80,
  },
  {
    refNo: '10',
    partNo: '08319-3110A-000',
    partName: 'NUT',
    qty: 1,
    price: 42,
    xRatio: 61,
    yRatio: 78,
  },
  {
    refNo: '11',
    partNo: '43110-12K00-000',
    partName: 'PEDAL,BRAKE',
    qty: 1,
    price: 561,
    xRatio: 35,
    yRatio: 27,
  },
  {
    refNo: '12',
    partNo: '43128-12K00-000',
    partName: 'PLATE,BRAKE RETURN SPRING',
    qty: 1,
    price: 64,
    xRatio: 68,
    yRatio: 14,
  },
  {
    refNo: '13',
    partNo: '43211-25G00-000',
    partName: 'SPRING,BRAKE PEDAL RETURN',
    qty: 1,
    price: 48,
    xRatio: 67,
    yRatio: 26,
  },
  {
    refNo: '14',
    partNo: '04111-3025A-000',
    partName: 'PIN',
    qty: 1,
    price: 28,
    xRatio: 73,
    yRatio: 24,
  },
];
