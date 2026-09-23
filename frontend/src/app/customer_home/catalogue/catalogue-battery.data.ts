import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.310A (1-D-3) BATTERY, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-battery-fig-310d-1-c-14/
 * (9 rows, no variant groups; refNo 2 prints twice on the diagram, qty 5, the clearest
 * (left) occurrence was used per the RADIATOR_HOSE precedent). refNo 2 and 8 have no price
 * on the live site (real gaps, not scraping misses). xRatio/yRatio measured with the
 * pixel-centroid technique (see catalogue-cylinder-head-cover.data.ts) and dot-overlay
 * verified.
 */
export const BATTERY_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '33610-25GB0-000',
    partName: 'BATTERY ASSY (GTZ6V,12V5AH)',
    qty: 1,
    price: 5241,
    xRatio: 58.4,
    yRatio: 18.4,
  },
  {
    refNo: '2',
    partNo: '33652-38000-000',
    partName: 'PROTECTOR,BATTERY (40X30X3.0)',
    qty: 5,
    price: null,
    xRatio: 34.3,
    yRatio: 44.6,
  },
  {
    refNo: '3',
    partNo: '33652-39J00-000',
    partName: 'PROTECTOR,BATTERY (20X40X3)',
    qty: 2,
    price: 60,
    xRatio: 59.3,
    yRatio: 13.1,
  },
  {
    refNo: '4',
    partNo: '36652-07H00-000',
    partName: 'CUSHION,HARNESS WIRING (20X30X 12.0)',
    qty: 1,
    price: 9,
    xRatio: 36.3,
    yRatio: 11.2,
  },
  {
    refNo: '5',
    partNo: '33810-12K00-000',
    partName: 'WIRE,STARTER MOTOR LEAD',
    qty: 1,
    price: 325,
    xRatio: 59.5,
    yRatio: 70.8,
  },
  {
    refNo: '6',
    partNo: '31861-48B10-000',
    partName: 'CAP,STARTER MOTOR LEAD',
    qty: 1,
    price: 25,
    xRatio: 65.9,
    yRatio: 78.6,
  },
  {
    refNo: '7',
    partNo: '33820-12K00-000',
    partName: 'WIRE,BATTERY PLUS LEAD',
    qty: 1,
    price: 204,
    xRatio: 84.5,
    yRatio: 15.9,
  },
  {
    refNo: '8',
    partNo: '33624-22J00-000',
    partName: 'CAP,BATTERY PLUS TERMINAL',
    qty: 1,
    price: null,
    xRatio: 90.3,
    yRatio: 21.1,
  },
  {
    refNo: '9',
    partNo: '33860-12K00-000',
    partName: 'WIRE,BATTERY MINUS LEAD',
    qty: 1,
    price: 362,
    xRatio: 29.0,
    yRatio: 18.9,
  },
];
