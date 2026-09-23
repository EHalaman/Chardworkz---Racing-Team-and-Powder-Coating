import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.172A (1-C-4) FUEL PUMP, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-fuel-pump-fig-172a-1-c-4/
 * (8 rows, no variant groups, all priced). xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const FUEL_PUMP_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '15100-12K00-000',
    partName: 'PUMP ASSY,FUEL',
    qty: 1,
    price: 3922,
    xRatio: 20.3,
    yRatio: 40.9,
  },
  {
    refNo: '2',
    partNo: '15420-12K00-000',
    partName: 'FILTER',
    qty: 1,
    price: 382,
    xRatio: 48.4,
    yRatio: 50.0,
  },
  {
    refNo: '3',
    partNo: '15424-09JB0-000',
    partName: 'O-RING',
    qty: 1,
    price: 79,
    xRatio: 47.9,
    yRatio: 46.7,
  },
  {
    refNo: '4',
    partNo: '15121-12K00-000',
    partName: 'PLATE,FUEL PUMP',
    qty: 1,
    price: 84,
    xRatio: 58.7,
    yRatio: 20.6,
  },
  {
    refNo: '5',
    partNo: '15201-09JA0-000',
    partName: 'O-RING,FUEL PUMP',
    qty: 1,
    price: 432,
    xRatio: 28.6,
    yRatio: 60.8,
  },
  {
    refNo: '6',
    partNo: '15810-12K00-000',
    partName: 'HOSE,FUEL',
    qty: 1,
    price: 813,
    xRatio: 65.3,
    yRatio: 58.3,
  },
  {
    refNo: '7',
    partNo: '09404-06040-000',
    partName: 'CLAMP,FUEL HOSE',
    qty: 1,
    price: 40,
    xRatio: 70.3,
    yRatio: 71.2,
  },
  {
    refNo: '8',
    partNo: '01547-0610A-000',
    partName: 'BOLT',
    qty: 5,
    price: 32,
    xRatio: 26.5,
    yRatio: 15.9,
  },
];
