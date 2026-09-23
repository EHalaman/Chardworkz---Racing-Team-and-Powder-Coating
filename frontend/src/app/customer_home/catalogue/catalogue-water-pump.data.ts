import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.180A (1-C-3) WATER PUMP, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-water-pump-fig-180a-1-c-5/
 * (11 rows, no variant groups, all priced). refNo 10 and 11 each print twice (qty 2); the
 * clearest (leftmost) occurrence of each was used, per the RADIATOR_HOSE precedent.
 * xRatio/yRatio measured with the pixel-centroid technique (see
 * catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const WATER_PUMP_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '16331-12K00-000',
    partName: 'GEAR,OIL PUMP DRIVEN (NT:30)',
    qty: 1,
    price: 195,
    xRatio: 72.3,
    yRatio: 60.8,
  },
  {
    refNo: '2',
    partNo: '17410-12K20-000',
    partName: 'CASE,WATER PUMP',
    qty: 1,
    price: 1128,
    xRatio: 43.9,
    yRatio: 17.3,
  },
  {
    refNo: '3',
    partNo: '17431-12K10-000',
    partName: 'O RING,WATER PUMP CASE',
    qty: 1,
    price: 145,
    xRatio: 66.7,
    yRatio: 27.5,
  },
  {
    refNo: '4',
    partNo: '17461-12K00-000',
    partName: 'SEAL,WATER PUMP SHAFT OIL',
    qty: 1,
    price: 655,
    xRatio: 46.1,
    yRatio: 52.9,
  },
  {
    refNo: '5',
    partNo: '17510-12K01-000',
    partName: 'SHAFT,WATER PUMP',
    qty: 1,
    price: 365,
    xRatio: 77.5,
    yRatio: 32.2,
  },
  {
    refNo: '6',
    partNo: '09168-06018-000',
    partName: 'GASKET (6.2X13X1.2)',
    qty: 1,
    price: 68,
    xRatio: 28.2,
    yRatio: 20.0,
  },
  {
    refNo: '7',
    partNo: '09261-02001-000',
    partName: 'PIN (2.5X19.8)',
    qty: 1,
    price: 48,
    xRatio: 64.2,
    yRatio: 71.2,
  },
  {
    refNo: '8',
    partNo: '01547-0620B-000',
    partName: 'BOLT',
    qty: 3,
    price: 52,
    xRatio: 21.0,
    yRatio: 17.5,
  },
  {
    refNo: '9',
    partNo: '01547-0675A-000',
    partName: 'BOLT',
    qty: 2,
    price: 60,
    xRatio: 12.0,
    yRatio: 17.4,
  },
  {
    refNo: '10',
    partNo: '08113-0608A-000',
    partName: 'BEARING',
    qty: 2,
    price: 209,
    xRatio: 52.9,
    yRatio: 56.2,
  },
  {
    refNo: '11',
    partNo: '08332-1106A-000',
    partName: 'E-RING',
    qty: 2,
    price: 74,
    xRatio: 61.7,
    yRatio: 60.65,
  },
];
