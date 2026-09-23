import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.107A (1-B-4) CYLINDER, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-cylinder-fig-107a-1-b-4/
 * (7 rows, no variant groups, all priced). xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts).
 */
export const CYLINDER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '11211-12K90-0F0',
    partName: 'CYLINDER',
    qty: 1,
    price: 5017,
    xRatio: 23.1,
    yRatio: 38.5,
  },
  {
    refNo: '2',
    partNo: '01421-0620A-000',
    partName: 'BOLT,STUD',
    qty: 2,
    price: 64,
    xRatio: 74.1,
    yRatio: 51.9,
  },
  {
    refNo: '3',
    partNo: '08316-1006A-000',
    partName: 'NUT (6X12)',
    qty: 2,
    price: 69,
    xRatio: 71.2,
    yRatio: 40.7,
  },
  {
    refNo: '4',
    partNo: '11241-12K00-000',
    partName: 'GASKET,CYLINDER (NA)',
    qty: 1,
    price: 143,
    xRatio: 22.6,
    yRatio: 59.7,
  },
  {
    refNo: '5',
    partNo: '04211-11129-000',
    partName: 'PIN',
    qty: 2,
    price: 54,
    xRatio: 65.4,
    yRatio: 50.5,
  },
  {
    refNo: '6',
    partNo: '13650-49X00-000',
    partName: 'SENSOR,TEMP',
    qty: 1,
    price: 2766,
    xRatio: 82.3,
    yRatio: 22.2,
  },
  {
    refNo: '7',
    partNo: '09168-12017-000',
    partName: 'GASKET (12X17X1)',
    qty: 1,
    price: 64,
    xRatio: 71.4,
    yRatio: 26.9,
  },
];
