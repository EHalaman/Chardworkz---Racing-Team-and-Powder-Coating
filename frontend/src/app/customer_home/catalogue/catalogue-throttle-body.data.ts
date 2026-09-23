import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.140A (1-B-13) THROTTLE BODY, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-throttle-body-fig-140a-1-b-13/
 * (9 rows, no variant groups; refNo 4 has no price on the live site, a real gap not a
 * scraping miss). xRatio/yRatio measured with the pixel-centroid technique (see
 * catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const THROTTLE_BODY_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '13400-12K01-000',
    partName: 'BODY ASSY,THROTTLE',
    qty: 1,
    price: 5026,
    xRatio: 70.6,
    yRatio: 12.8,
  },
  {
    refNo: '2',
    partNo: '13453-36F00-000',
    partName: '.O-RING',
    qty: 1,
    price: 141,
    xRatio: 67.9,
    yRatio: 17.1,
  },
  {
    refNo: '3',
    partNo: '13662-22J00-000',
    partName: '.ADJUSTER,BAS',
    qty: 1,
    price: 110,
    xRatio: 74.5,
    yRatio: 19.3,
  },
  {
    refNo: '4',
    partNo: '15710-12K00-000',
    partName: 'INJECTOR ASSY,FUEL',
    qty: 1,
    price: null,
    xRatio: 25.4,
    yRatio: 69.1,
  },
  {
    refNo: '5',
    partNo: '15716-42J00-000',
    partName: '.O-RING',
    qty: 1,
    price: 435,
    xRatio: 31.5,
    yRatio: 66.8,
  },
  {
    refNo: '6',
    partNo: '15719-12K01-000',
    partName: '.RING, SEAL',
    qty: 1,
    price: 92,
    xRatio: 26.8,
    yRatio: 47.6,
  },
  {
    refNo: '7',
    partNo: '15722-42J00-000',
    partName: 'COVER, FUEL INJECTOR',
    qty: 1,
    price: 44,
    xRatio: 40.5,
    yRatio: 80.4,
  },
  {
    refNo: '8',
    partNo: '15830-12K00-000',
    partName: 'JOINT,FUEL HOSE',
    qty: 1,
    price: 159,
    xRatio: 60.6,
    yRatio: 50.1,
  },
  {
    refNo: '9',
    partNo: '01547-0625A-000',
    partName: 'BOLT',
    qty: 1,
    price: 52,
    xRatio: 74.1,
    yRatio: 63.5,
  },
];
