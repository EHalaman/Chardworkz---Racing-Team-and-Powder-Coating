import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.541A (1-F-5) REAR SWINGING ARM, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-rear-swinging-arm-fig-541a-1-f-5/
 * (parts table + diagram image). xRatio/yRatio measured with the Node/Jimp pixel-centroid
 * pipeline (see catalogue-pillion-rider-handle.data.ts). refNos 3, 5 and 11 initially had no
 * strong digit-glyph blob in their estimated search window (the rough position guess from the
 * full-diagram overview was too far off for all three, unlike the other 8 labels which resolved
 * on the first pass) - each was re-located by widening the crop around its own leader line,
 * confirmed visually, then re-scoped precisely. refNo 10's "10" is two separate glyph blobs;
 * xRatio/yRatio is their midpoint, same convention as catalogue-rear-caliper.data.ts.
 */
export const REAR_SWINGING_ARM_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '61100-12820-019',
    partName: 'SWINGING ARM SET,REAR (BLACK)',
    qty: 1,
    price: 3200,
    xRatio: 26,
    yRatio: 61,
  },
  {
    refNo: '2',
    partNo: '61211-25G20-000',
    partName: 'SHAFT,RR SWGARM PIVOT',
    qty: 1,
    price: 246,
    xRatio: 56,
    yRatio: 71,
  },
  {
    refNo: '3',
    partNo: '08319-3112A-000',
    partName: 'NUT',
    qty: 1,
    price: 118,
    xRatio: 15,
    yRatio: 56,
  },
  {
    refNo: '4',
    partNo: '61273-25G10-000',
    partName: 'BUFFER,CHAIN TOUCH DEFENSE',
    qty: 1,
    price: 131,
    xRatio: 40,
    yRatio: 66,
  },
  {
    refNo: '5',
    partNo: '61361-09G00-000',
    partName: 'BOLT,CHAIN CASE',
    qty: 1,
    price: 32,
    xRatio: 63,
    yRatio: 56,
  },
  {
    refNo: '6',
    partNo: '62100-12K10-019',
    partName: 'ABSORBER ASSY,REAR SHOCK (BLACK)',
    qty: 1,
    price: 6515,
    xRatio: 26,
    yRatio: 32,
  },
  {
    refNo: '7',
    partNo: '09103-10049-000',
    partName: 'BOLT (10X44)',
    qty: 1,
    price: 52,
    xRatio: 42,
    yRatio: 25,
  },
  {
    refNo: '8',
    partNo: '62313-25G10-000',
    partName: 'BOLT,RR SHOCK ABSORBER LOWER',
    qty: 1,
    price: 69,
    xRatio: 68,
    yRatio: 60,
  },
  {
    refNo: '9',
    partNo: '08319-3110A-000',
    partName: 'NUT',
    qty: 1,
    price: 42,
    xRatio: 24,
    yRatio: 43,
  },
  {
    refNo: '10',
    partNo: '61311-12K00-000',
    partName: 'CASE,CHAIN',
    qty: 1,
    price: 277,
    xRatio: 67,
    yRatio: 22,
  },
  {
    refNo: '11',
    partNo: '61361-09G30-000',
    partName: 'BOLT,CHAIN CASE',
    qty: 2,
    price: 32,
    xRatio: 79,
    yRatio: 35,
  },
];
