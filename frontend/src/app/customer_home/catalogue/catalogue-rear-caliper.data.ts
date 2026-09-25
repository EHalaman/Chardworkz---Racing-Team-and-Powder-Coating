import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.555A (1-F-7) REAR CALIPER, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-rear-caliper-fig-555a-1-f-7/
 * (parts table + diagram image). xRatio/yRatio measured with the Node/Jimp pixel-centroid
 * pipeline (see catalogue-pillion-rider-handle.data.ts) - all 12 digit-glyph blobs found and
 * confirmed by compositing markers back onto the real image (see the "candidates were checked
 * against a false-positive from a bolt-thread/circle-detail texture" precedent in that file;
 * this figure's own tricky case was refNo 4, whose nearest blob candidate on the first pass was
 * actually the spring-clip part's own line art, not the digit - resolved by widening the crop and
 * re-locating the real "4" glyph before re-running the scoped search). Two-digit labels (10, 11,
 * 12) are two separate glyph blobs (e.g. "1" then "0") - xRatio/yRatio is the midpoint of both.
 * Part names/refNo hierarchy dots (".", "..") and "CARRIER SYBASSY" (not a typo introduced here)
 * are copied exactly as Suzuki PH's own table renders them.
 */
export const REAR_CALIPER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '69100-12K10-000',
    partName: 'CALIPER ASSY,REAR',
    qty: 1,
    price: 5315,
    xRatio: 73,
    yRatio: 13,
  },
  {
    refNo: '2',
    partNo: '69100-12820-000',
    partName: '.PISTON SET',
    qty: 1,
    price: null,
    xRatio: 63,
    yRatio: 39,
  },
  {
    refNo: '3',
    partNo: '69300-12810-000',
    partName: '..SEAL SET,PISTON',
    qty: 1,
    price: 661,
    xRatio: 57,
    yRatio: 42,
  },
  {
    refNo: '4',
    partNo: '69115-12K00-000',
    partName: '.SPRING',
    qty: 1,
    price: 273,
    xRatio: 38,
    yRatio: 51,
  },
  {
    refNo: '5',
    partNo: '59112-44B00-000',
    partName: '.BOOT,AXLE',
    qty: 1,
    price: 284,
    xRatio: 20,
    yRatio: 55,
  },
  {
    refNo: '6',
    partNo: '59313-36500-000',
    partName: '.INSULATOR,AXLE',
    qty: 1,
    price: 184,
    xRatio: 47,
    yRatio: 36,
  },
  {
    refNo: '7',
    partNo: '69141-12K00-000',
    partName: '.PIN',
    qty: 1,
    price: 325,
    xRatio: 29,
    yRatio: 20,
  },
  {
    refNo: '8',
    partNo: '69145-12K00-000',
    partName: '.D-RING',
    qty: 1,
    price: 214,
    xRatio: 38,
    yRatio: 23,
  },
  {
    refNo: '9',
    partNo: '69150-12K00-000',
    partName: '.CARRIER SYBASSY',
    qty: 1,
    price: 2037,
    xRatio: 46,
    yRatio: 70,
  },
  {
    refNo: '10',
    partNo: '59121-12K00-000',
    partName: '.BLEEDER',
    qty: 1,
    price: 560,
    xRatio: 13,
    yRatio: 25,
  },
  {
    refNo: '11',
    partNo: '59122-02B40-000',
    partName: '.CAP,BLEEDER',
    qty: 1,
    price: null,
    xRatio: 13,
    yRatio: 30,
  },
  {
    refNo: '12',
    partNo: '69100-12830-000',
    partName: '.PAD SET',
    qty: 1,
    price: 1668,
    xRatio: 87,
    yRatio: 46,
  },
];
