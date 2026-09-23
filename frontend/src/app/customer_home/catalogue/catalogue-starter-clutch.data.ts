import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.122A (1-B-8) STARTER CLUTCH, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-starter-clutch-fig-122a-1-b-8/
 * (6 rows, no variant groups, all priced). xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const STARTER_CLUTCH_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '12611-12K00-000',
    partName: 'GEAR,STARTER IDLE (NT:15/53)',
    qty: 1,
    price: 344,
    xRatio: 52.7,
    yRatio: 20.7,
  },
  {
    refNo: '2',
    partNo: '12600-12822-000',
    partName: 'CLUTCH SET,STARTER (NT:63)',
    qty: 1,
    price: 4561,
    xRatio: 41.2,
    yRatio: 33.9,
  },
  {
    refNo: '3',
    partNo: '09180-13012-000',
    partName: 'SPACER (13X19X6)',
    qty: 1,
    price: 71,
    xRatio: 73.3,
    yRatio: 30.4,
  },
  {
    refNo: '4',
    partNo: '09206-13007-000',
    partName: 'PIN (7.4X13X40)',
    qty: 1,
    price: 115,
    xRatio: 66.0,
    yRatio: 28.2,
  },
  {
    refNo: '5',
    partNo: '09263-22075-000',
    partName: 'BEARING (22X29X16.8)',
    qty: 1,
    price: 282,
    xRatio: 63.8,
    yRatio: 55.4,
  },
  {
    refNo: '6',
    partNo: '07130-0616A-000',
    partName: 'BOLT',
    qty: 3,
    price: 74,
    xRatio: 57.6,
    yRatio: 72.1,
  },
];
