import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.108A (1-B-5) CRANKCASE, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-crankcase-fig-108a-1-b-5/
 * (9 rows, no variant groups, all priced). xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts). The page shows two views of the same
 * figure - an assembled top view (refNo 1-3, 5) and an exploded 3D view below it (refNo
 * 1, 4, 6-9) - refNo 5 and 6 share one printed "5·6" leader in the top view pointing at
 * the same bolt hole; refNo 6's own position was taken from its clearer, separate leader in
 * the exploded view instead.
 */
export const CRANKCASE_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '11300-12K00-000',
    partName: 'CRANKCASE ASSY',
    qty: 1,
    price: 25953,
    xRatio: 57.2,
    yRatio: 45.4,
  },
  {
    refNo: '2',
    partNo: '01547-0640B-000',
    partName: '.BOLT',
    qty: 14,
    price: 56,
    xRatio: 70.6,
    yRatio: 13.0,
  },
  {
    refNo: '3',
    partNo: '01547-0640A-000',
    partName: '.BOLT',
    qty: 3,
    price: 24,
    xRatio: 66.9,
    yRatio: 13.0,
  },
  {
    refNo: '4',
    partNo: '09206-10014-000',
    partName: '.PIN (6.4X10X20)',
    qty: 2,
    price: 26,
    xRatio: 25.7,
    yRatio: 72.6,
  },
  {
    refNo: '5',
    partNo: '01550-1016A-000',
    partName: 'BOLT',
    qty: 1,
    price: 77,
    xRatio: 66.9,
    yRatio: 34.9,
  },
  {
    refNo: '6',
    partNo: '09168-10L02-000',
    partName: 'GASKET (NA)',
    qty: 1,
    price: 15,
    xRatio: 62.9,
    yRatio: 83.6,
  },
  {
    refNo: '7',
    partNo: '11313-25G00-000',
    partName: 'JET,T/M OIL GALLERY',
    qty: 1,
    price: 83,
    xRatio: 18.2,
    yRatio: 42.2,
  },
  {
    refNo: '8',
    partNo: '09103-10723-000',
    partName: 'BOLT (L:140)',
    qty: 2,
    price: 197,
    xRatio: 87.8,
    yRatio: 65.9,
  },
  {
    refNo: '9',
    partNo: '08319-3110A-000',
    partName: 'NUT',
    qty: 2,
    price: 42,
    xRatio: 21.0,
    yRatio: 40.8,
  },
];
