import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.155A (1-B-14) AIR CLEANER, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-air-cleaner-fig-155a-1-b-14/
 * (17 rows; refNo 14 and 16 show no price on the live site itself - kept as `null`, not
 * guessed or zeroed). xRatio/yRatio measured with the pixel-centroid technique (see
 * catalogue-cylinder-head-cover.data.ts): the diagram's own printed digits are dense here
 * (17 labels vs. Cylinder Head Cover's 5, several near identical-looking small drawn bolt/
 * washer/clip icons of the same pixel size as a digit glyph), so every candidate blob found
 * by the connected-component scan was cross-checked against a full-image marker plot before
 * being accepted or discarded as a false positive - about a third of the raw candidates were
 * drawing details, not real digits. refNo 3 and refNo 6 each print twice on the diagram
 * (matching their qty of 2); the first clean occurrence of each was used.
 */
export const AIR_CLEANER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '13700-12K00-000',
    partName: 'CLEANER ASSY,AIR',
    qty: 1,
    price: 2114,
    xRatio: 28,
    yRatio: 14,
  },
  {
    refNo: '2',
    partNo: '13741-12K00-000',
    partName: '.CAP,AIR CLEANER',
    qty: 1,
    price: 237,
    xRatio: 30,
    yRatio: 27,
  },
  {
    refNo: '3',
    partNo: '13746-12K00-000',
    partName: '.GASKET',
    qty: 2,
    price: 56,
    xRatio: 36,
    yRatio: 30,
  },
  {
    refNo: '4',
    partNo: '13761-12K00-000',
    partName: '.RESONATOR',
    qty: 1,
    price: 260,
    xRatio: 71,
    yRatio: 73,
  },
  {
    refNo: '5',
    partNo: '13780-12K00-000',
    partName: '.FILTER,ASSY',
    qty: 1,
    price: 427,
    xRatio: 39,
    yRatio: 55,
  },
  {
    refNo: '6',
    partNo: '13821-12K00-000',
    partName: '.CLIP',
    qty: 2,
    price: 36,
    xRatio: 45,
    yRatio: 62,
  },
  {
    refNo: '7',
    partNo: '13822-12K00-000',
    partName: '.CLIP',
    qty: 1,
    price: 56,
    xRatio: 81,
    yRatio: 38,
  },
  {
    refNo: '8',
    partNo: '13853-12K00-000',
    partName: '.TUBE,BREATHER',
    qty: 1,
    price: 148,
    xRatio: 35,
    yRatio: 63,
  },
  {
    refNo: '9',
    partNo: '13878-12K00-000',
    partName: '.PLUG,DRAIN',
    qty: 1,
    price: 52,
    xRatio: 61,
    yRatio: 65,
  },
  {
    refNo: '10',
    partNo: '13881-12K00-000',
    partName: '.TUBE,OUTLET',
    qty: 1,
    price: 446,
    xRatio: 73,
    yRatio: 21,
  },
  {
    refNo: '11',
    partNo: '13891-12K00-000',
    partName: '.TUBE,INLET',
    qty: 1,
    price: 237,
    xRatio: 44,
    yRatio: 31,
  },
  {
    refNo: '12',
    partNo: '09401-11101-000',
    partName: '.CLIP',
    qty: 1,
    price: 70,
    xRatio: 63,
    yRatio: 63,
  },
  {
    refNo: '13',
    partNo: '09402-44208-000',
    partName: '.CLAMP',
    qty: 1,
    price: 98,
    xRatio: 67,
    yRatio: 21,
  },
  {
    refNo: '14',
    partNo: '03541-0512A-000',
    partName: '.SCREW',
    qty: 1,
    price: null,
    xRatio: 88,
    yRatio: 50,
  },
  {
    refNo: '15',
    partNo: '03541-0520B-000',
    partName: '.SCREW',
    qty: 5,
    price: 71,
    xRatio: 11,
    yRatio: 49,
  },
  {
    refNo: '16',
    partNo: '01580-0616A-000',
    partName: 'BOLT',
    qty: 1,
    price: null,
    xRatio: 93,
    yRatio: 72,
  },
  {
    refNo: '17',
    partNo: '01580-0620A-000',
    partName: 'BOLT',
    qty: 1,
    price: 71,
    xRatio: 93,
    yRatio: 34,
  },
];
