import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.505A (1-E-12) SEAT, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-seat-fig-505a-1-e-12/
 * (parts table + diagram image). xRatio/yRatio measured with the Node/Jimp pixel-centroid
 * pipeline (see catalogue-pillion-rider-handle.data.ts). refNo 2 prints twice on this diagram
 * (qty 3 across two seat-cushion mount positions) - the clearer (top) occurrence was used, same
 * repeated-position handling as catalogue-rear-fender.data.ts. refNos 8, 12 and 14 needed a wider
 * crop to find their own digit after the first-pass estimate landed on blank space or a
 * neighboring part's line art (same recurring pattern as the other larger figures in this set).
 */
export const SEAT_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '45100-12K10-QE7',
    partName: 'SEAT ASSY (BLACK)',
    qty: 1,
    price: 2570,
    xRatio: 38,
    yRatio: 21,
  },
  {
    refNo: '2',
    partNo: '45148-20G90-000',
    partName: '.CUSHION,SEAT MOUNT',
    qty: 3,
    price: 36,
    xRatio: 82,
    yRatio: 34,
  },
  {
    refNo: '3',
    partNo: '45149-09G40-000',
    partName: '.CUSHION,SEAT MOUNT',
    qty: 4,
    price: 56,
    xRatio: 74,
    yRatio: 42,
  },
  {
    refNo: '4',
    partNo: '45289-12K00-000',
    partName: '.PLATE,SEAT BOTTOM FRAME',
    qty: 1,
    price: 56,
    xRatio: 85,
    yRatio: 38,
  },
  {
    refNo: '5',
    partNo: '45250-12K00-000',
    partName: 'BRACKET,SEAT HINGE UPPER',
    qty: 1,
    price: 113,
    xRatio: 24,
    yRatio: 69,
  },
  {
    refNo: '6',
    partNo: '45231-12K10-000',
    partName: 'BOLT,SEAT HINGE',
    qty: 1,
    price: 44,
    xRatio: 12,
    yRatio: 64,
  },
  {
    refNo: '7',
    partNo: '08316-1006A-000',
    partName: 'NUT (6X12)',
    qty: 2,
    price: 69,
    xRatio: 17,
    yRatio: 67,
  },
  {
    refNo: '8',
    partNo: '45288-12K00-000',
    partName: 'GUIDE,SEAT LOCK CABLE',
    qty: 1,
    price: 40,
    xRatio: 82,
    yRatio: 66,
  },
  {
    refNo: '9',
    partNo: '45289-11F00-000',
    partName: 'PLATE,SEAT LOCK ASSY',
    qty: 1,
    price: 32,
    xRatio: 77,
    yRatio: 64,
  },
  {
    refNo: '10',
    partNo: '45220-04K40-000',
    partName: 'BRACKET,STRIKER SUPPORT',
    qty: 1,
    price: 433,
    xRatio: 77,
    yRatio: 58,
  },
  {
    refNo: '11',
    partNo: '02142-0616A-000',
    partName: 'SCREW',
    qty: 2,
    price: 43,
    xRatio: 78,
    yRatio: 50,
  },
  {
    refNo: '12',
    partNo: '95700-09860-000',
    partName: 'LOCK SET,SEAT',
    qty: 1,
    price: 1299,
    xRatio: 87,
    yRatio: 67,
  },
  {
    refNo: '13',
    partNo: '96510-12K01-000',
    partName: 'TOOL ASSY',
    qty: 1,
    price: null,
    xRatio: 63,
    yRatio: 76,
  },
  {
    refNo: '14',
    partNo: '45711-12K00-000',
    partName: 'GUIDE,SEAT LOCK',
    qty: 1,
    price: 200,
    xRatio: 88,
    yRatio: 52,
  },
];
