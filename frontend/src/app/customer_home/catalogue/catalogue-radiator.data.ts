import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.185A (1-C-4) RADIATOR, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-radiator-fig-185a-1-c-6/
 * (11 rows, no variant groups, all priced). xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts). refNo 3, 4, 9, 10 each print twice
 * (qty 2, one occurrence per fan-mount side); the clearer of the two occurrences was used
 * for each.
 */
export const RADIATOR_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '17710-12K00-000',
    partName: 'RADIATOR ASSY,WATER',
    qty: 1,
    price: 5042,
    xRatio: 44.4,
    yRatio: 63.1,
  },
  {
    refNo: '2',
    partNo: '17800-12K01-000',
    partName: 'FAN ASSY',
    qty: 1,
    price: 3076,
    xRatio: 80.7,
    yRatio: 39.7,
  },
  {
    refNo: '3',
    partNo: '17802-12K00-000',
    partName: 'NUT',
    qty: 2,
    price: 88,
    xRatio: 62.8,
    yRatio: 27.1,
  },
  {
    refNo: '4',
    partNo: '01550-0616A-000',
    partName: 'BOLT',
    qty: 2,
    price: 63,
    xRatio: 70.5,
    yRatio: 28.3,
  },
  {
    refNo: '5',
    partNo: '17730-14G00-000',
    partName: 'CAP,RADIATOR (1.1)',
    qty: 1,
    price: 1478,
    xRatio: 23.0,
    yRatio: 29.3,
  },
  {
    refNo: '6',
    partNo: '17751-12K00-000',
    partName: 'BRACKET,RADIATOR LOWER',
    qty: 1,
    price: 44,
    xRatio: 47.9,
    yRatio: 73.5,
  },
  {
    refNo: '7',
    partNo: '17781-12J00-000',
    partName: 'CUSHION,RADIATOR LOWER',
    qty: 1,
    price: 58,
    xRatio: 41.8,
    yRatio: 67.2,
  },
  {
    refNo: '8',
    partNo: '09116-06111-000',
    partName: 'BOLT (6X20)',
    qty: 2,
    price: 12,
    xRatio: 19.4,
    yRatio: 16.5,
  },
  {
    refNo: '9',
    partNo: '09180-06310-000',
    partName: 'SPACER (6.5X10X10)',
    qty: 2,
    price: 65,
    xRatio: 29.5,
    yRatio: 19.9,
  },
  {
    refNo: '10',
    partNo: '09320-10501-000',
    partName: 'CUSHION (10X20X10)',
    qty: 2,
    price: 164,
    xRatio: 24.8,
    yRatio: 18.0,
  },
  {
    refNo: '11',
    partNo: '01550-0612A-000',
    partName: 'BOLT',
    qty: 1,
    price: 12,
    xRatio: 52.8,
    yRatio: 79.4,
  },
];
