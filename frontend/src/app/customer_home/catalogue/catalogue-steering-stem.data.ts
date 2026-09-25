import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.524A (1-E-15) STEERING STEM, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-steering-stem-fig-524a-1-e-15/
 * (parts table + diagram image). xRatio/yRatio measured with the Node/Jimp pixel-centroid
 * pipeline (see catalogue-pillion-rider-handle.data.ts). refNo 11's "11" is unusual - both
 * character glyphs are the thin "1" stroke, and the first-pass window (radius 20) only found one
 * of the two; narrowing to radius 10 around the same center found the second, 8px to its right.
 * refNo 1's own price is blank on the live site itself (kept null, not guessed), and refNos 12/13
 * are both "BALL" at the same OEM part number with no listed price - real bearing ball counts
 * (23 and 28) for the upper and lower steering races, not a scraping duplicate.
 */
export const STEERING_STEM_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '51410-12K00-000',
    partName: 'STEM,STEERING',
    qty: 1,
    price: null,
    xRatio: 65,
    yRatio: 58,
  },
  {
    refNo: '2',
    partNo: '51622-25G00-000',
    partName: '.RACE,STEERING LWR',
    qty: 1,
    price: 401,
    xRatio: 60,
    yRatio: 50,
  },
  {
    refNo: '3',
    partNo: '51311-12K10-000',
    partName: 'BRACKET,FR FORK UPPER',
    qty: 1,
    price: 2331,
    xRatio: 40,
    yRatio: 15,
  },
  {
    refNo: '4',
    partNo: '51353-12K00-000',
    partName: 'NUT',
    qty: 1,
    price: 400,
    xRatio: 74,
    yRatio: 13,
  },
  {
    refNo: '5',
    partNo: '51354-49G00-000',
    partName: 'WASHER',
    qty: 1,
    price: 52,
    xRatio: 73,
    yRatio: 16,
  },
  {
    refNo: '6',
    partNo: '51321-13E00-000',
    partName: 'BOLT,HANDLE HOLDER',
    qty: 2,
    price: 36,
    xRatio: 77,
    yRatio: 26,
  },
  {
    refNo: '7',
    partNo: '51434-12K00-000',
    partName: 'BOLT',
    qty: 4,
    price: 44,
    xRatio: 53,
    yRatio: 82,
  },
  {
    refNo: '8',
    partNo: '51631-05000-000',
    partName: 'NUT',
    qty: 1,
    price: 181,
    xRatio: 67,
    yRatio: 30,
  },
  {
    refNo: '9',
    partNo: '51621-41H00-000',
    partName: 'RACE,STEERING OUTER UPR',
    qty: 1,
    price: 228,
    xRatio: 65,
    yRatio: 37,
  },
  {
    refNo: '10',
    partNo: '51611-41H01-000',
    partName: 'RACE,STEERING INNER UPPER',
    qty: 1,
    price: 207,
    xRatio: 64,
    yRatio: 42,
  },
  {
    refNo: '11',
    partNo: '51612-41H01-000',
    partName: 'RACE,STEERING INNER LOWER',
    qty: 1,
    price: 213,
    xRatio: 62,
    yRatio: 47,
  },
  {
    refNo: '12',
    partNo: '06111-06004-000',
    partName: 'BALL',
    qty: 23,
    price: null,
    xRatio: 63,
    yRatio: 39,
  },
  {
    refNo: '13',
    partNo: '06111-06004-000',
    partName: 'BALL',
    qty: 28,
    price: null,
    xRatio: 60,
    yRatio: 49,
  },
  {
    refNo: '14',
    partNo: '51643-06001-000',
    partName: 'DUST SEAL,STEERING UPR',
    qty: 1,
    price: 129,
    xRatio: 67,
    yRatio: 34,
  },
  {
    refNo: '15',
    partNo: '51344-23K00-000',
    partName: 'CAP,STEERING STEM',
    qty: 1,
    price: 59,
    xRatio: 77,
    yRatio: 9,
  },
];
