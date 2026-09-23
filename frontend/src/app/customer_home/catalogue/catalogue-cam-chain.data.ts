import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.127A (1-B-12) CAM CHAIN, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-cam-chain-fig-127a-1-b-12/
 * (10 rows, no variant groups; refNo 5 and 7 have no price on the live site, a real gap
 * not a scraping miss). xRatio/yRatio measured with the pixel-centroid technique (see
 * catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const CAM_CHAIN_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '12760-12K00-000',
    partName: 'CHAIN, CAMSHAFT DRIVE',
    qty: 1,
    price: 961,
    xRatio: 39.9,
    yRatio: 25.1,
  },
  {
    refNo: '2',
    partNo: '12771-12K00-000',
    partName: 'GUIDE, CAM CHAIN NO.1',
    qty: 1,
    price: 138,
    xRatio: 14.7,
    yRatio: 57.1,
  },
  {
    refNo: '3',
    partNo: '12782-12K01-000',
    partName: 'GUIDE, CAM CHAIN NO.2',
    qty: 1,
    price: 177,
    xRatio: 36.5,
    yRatio: 16.7,
  },
  {
    refNo: '4',
    partNo: '12811-12K00-000',
    partName: 'TENSIONER, CAM CHAIN',
    qty: 1,
    price: 460,
    xRatio: 53.2,
    yRatio: 46.9,
  },
  {
    refNo: '5',
    partNo: '12812-35C00-000',
    partName: 'BOLT, CAM CHAIN TENSIONER',
    qty: 1,
    price: null,
    xRatio: 58.7,
    yRatio: 58.4,
  },
  {
    refNo: '6',
    partNo: '08211-06181-000',
    partName: 'WASHER',
    qty: 1,
    price: 101,
    xRatio: 39.2,
    yRatio: 63.5,
  },
  {
    refNo: '7',
    partNo: '12830-12K00-000',
    partName: 'ADJUSTER ASSY, TENSIONER',
    qty: 1,
    price: null,
    xRatio: 72.2,
    yRatio: 27.5,
  },
  {
    refNo: '8',
    partNo: '12837-12K00-000',
    partName: 'GASKET, TENSIONER ADJUSTER',
    qty: 1,
    price: 36,
    xRatio: 62.2,
    yRatio: 33.2,
  },
  {
    refNo: '9',
    partNo: '01547-0620B-000',
    partName: 'BOLT',
    qty: 2,
    price: 52,
    xRatio: 85.9,
    yRatio: 19.8,
  },
  {
    refNo: '10',
    partNo: '12836-12K01-000',
    partName: 'BOLT, ADJUSTER SPRING',
    qty: 1,
    price: 111,
    xRatio: 92.85,
    yRatio: 31.9,
  },
];
