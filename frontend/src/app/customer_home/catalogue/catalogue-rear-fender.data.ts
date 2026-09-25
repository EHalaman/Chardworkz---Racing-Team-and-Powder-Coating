import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.474A (1-E-5) REAR FENDER, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-rear-fender-fig-474a-1-e-5/
 * (parts table + diagram image). xRatio/yRatio measured with the Node/Jimp pixel-centroid
 * pipeline (see catalogue-pillion-rider-handle.data.ts). refNo 7 and 9 sit close together on
 * this diagram and the first pass's search windows overlapped, both converging on the same
 * blob - resolved by cropping that area at high zoom to re-locate each digit's own leader line
 * before re-scoping. refNos 8 and 10 each print at two separate leader positions on the diagram
 * for one parts-table row (qty 2 and qty 3 respectively, not two rows) - only one position is
 * usable as this figure's single hotspot per the existing CatalogueDiagramPart/hotspotGroups
 * model, so the first (clearest) occurrence was used for refNo 8, and refNo 10's xRatio/yRatio
 * is the midpoint of its own two-glyph "10" label at that one occurrence (like the two-digit
 * labels in catalogue-rear-caliper.data.ts).
 */
export const REAR_FENDER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '63111-12K00-291',
    partName: 'FENDER,REAR FRONT',
    qty: 1,
    price: 836,
    xRatio: 27,
    yRatio: 17,
  },
  {
    refNo: '2',
    partNo: '63112-12K00-291',
    partName: 'FENDER,REAR REAR',
    qty: 1,
    price: 520,
    xRatio: 64,
    yRatio: 42,
  },
  {
    refNo: '3',
    partNo: '63113-12K00-291',
    partName: 'FENDER,REAR INNER',
    qty: 1,
    price: 269,
    xRatio: 43,
    yRatio: 61,
  },
  {
    refNo: '4',
    partNo: '63411-12K00-000',
    partName: 'MUDGUARD,REAR FENDER REAR',
    qty: 1,
    price: 211,
    xRatio: 79,
    yRatio: 73,
  },
  {
    refNo: '5',
    partNo: '63161-12K10-000',
    partName: 'BOLT,REAR FENDER FRONT',
    qty: 4,
    price: 36,
    xRatio: 47,
    yRatio: 64,
  },
  {
    refNo: '6',
    partNo: '63161-12K00-000',
    partName: 'BOLT (6X14.8)',
    qty: 2,
    price: 36,
    xRatio: 39,
    yRatio: 50,
  },
  {
    refNo: '7',
    partNo: '09148-05038-000',
    partName: 'NUT (M5)',
    qty: 2,
    price: 34,
    xRatio: 79,
    yRatio: 44,
  },
  {
    refNo: '8',
    partNo: '09409-06341-000',
    partName: 'CLIP (5.9X20.5)',
    qty: 2,
    price: 32,
    xRatio: 38,
    yRatio: 10,
  },
  {
    refNo: '9',
    partNo: '03541-0516A-000',
    partName: 'SCREW',
    qty: 4,
    price: 48,
    xRatio: 82,
    yRatio: 41,
  },
  {
    refNo: '10',
    partNo: '03541-0616A-000',
    partName: 'SCREW',
    qty: 3,
    price: null,
    xRatio: 47,
    yRatio: 80,
  },
  {
    refNo: '11',
    partNo: '68171-41H10-000',
    partName: 'EMBLEM,SUZUKI',
    qty: 1,
    price: 24,
    xRatio: 72,
    yRatio: 25,
  },
];
