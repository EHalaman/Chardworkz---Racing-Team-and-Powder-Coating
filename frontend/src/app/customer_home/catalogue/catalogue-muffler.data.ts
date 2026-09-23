import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.163A (1-C-2) MUFFLER, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-muffler-fig-163a-1-b-15/
 * (18 rows, no variant groups). xRatio/yRatio measured with the pixel-centroid technique
 * (see catalogue-cylinder-head-cover.data.ts).
 *
 * refNo 3 (COVER,MUFFLER) is the bracket apex over its two ".SHIELD" sub-items (4, 5) - the
 * printed digit there is small enough that it reads ambiguously as "3" or "8" at this
 * resolution, but "3" is the only fit that matches the table's own dot-prefix convention
 * (".SHIELD, MUF COVER" / ".SHIELD, MUF COVER RR" as sub-parts of item 3), so that's what's
 * used here; refNo 8 (WASHER) has its own separate, unambiguous position elsewhere on the
 * diagram (the screw/washer/spacer/cushion cluster) and was used for refNo 8's hotspot instead.
 *
 * refNo 12 (SPACER) and refNo 15 (NUT) show no price on the live page itself - both null, not
 * 0. refNo 15's scraped part number ("08319-3108A-00008319-3108A-000") is a real duplication
 * artifact in the site's own table text; deduped to the actual OEM number here.
 */
export const MUFFLER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '14181-47E20-000',
    partName: 'GASKET,EXH PIPE (NA)',
    qty: 1,
    price: 72,
    xRatio: 74.2,
    yRatio: 31.6,
  },
  {
    refNo: '2',
    partNo: '14310-12K50-000',
    partName: 'BODY,MUFFLER',
    qty: 1,
    price: 28039,
    xRatio: 63.2,
    yRatio: 62.5,
  },
  {
    refNo: '3',
    partNo: '14780-12K10-000',
    partName: 'COVER,MUFFLER',
    qty: 1,
    price: 1041,
    xRatio: 46.1,
    yRatio: 38.4,
  },
  {
    refNo: '4',
    partNo: '14784-12K00-000',
    partName: '.SHIELD, MUF COVER',
    qty: 1,
    price: 156,
    xRatio: 43.8,
    yRatio: 40.8,
  },
  {
    refNo: '5',
    partNo: '14785-12K00-000',
    partName: '.SHIELD, MUF COVER RR',
    qty: 1,
    price: 68,
    xRatio: 32.4,
    yRatio: 40.8,
  },
  {
    refNo: '6',
    partNo: '14795-10FA0-000',
    partName: 'GROMMET',
    qty: 2,
    price: 24,
    xRatio: 40.2,
    yRatio: 57.9,
  },
  {
    refNo: '7',
    partNo: '09139-06027-000',
    partName: 'SCREW (6X12)',
    qty: 1,
    price: 100,
    xRatio: 62.8,
    yRatio: 45.7,
  },
  {
    refNo: '8',
    partNo: '09160-06028-000',
    partName: 'WASHER (6.5X18X1.0)',
    qty: 1,
    price: 48,
    xRatio: 71.6,
    yRatio: 47.6,
  },
  {
    refNo: '9',
    partNo: '09180-06343-000',
    partName: 'SPACER',
    qty: 1,
    price: 101,
    xRatio: 65.5,
    yRatio: 49.6,
  },
  {
    refNo: '10',
    partNo: '09320-08087-000',
    partName: 'CUSHION',
    qty: 1,
    price: 77,
    xRatio: 59.4,
    yRatio: 47.8,
  },
  {
    refNo: '11',
    partNo: '09160-08134-000',
    partName: 'WASHER (8.5X26X1.6)',
    qty: 1,
    price: 64,
    xRatio: 18.9,
    yRatio: 51.2,
  },
  {
    refNo: '12',
    partNo: '09180-08151-000',
    partName: 'SPACER (8.6X12X17.5)',
    qty: 1,
    price: null,
    xRatio: 30.4,
    yRatio: 52.0,
  },
  {
    refNo: '13',
    partNo: '09320-12032-000',
    partName: 'CUSHION',
    qty: 2,
    price: 75,
    xRatio: 23.0,
    yRatio: 51.6,
  },
  {
    refNo: '14',
    partNo: '01550-0835A-000',
    partName: 'BOLT',
    qty: 1,
    price: 31,
    xRatio: 41.2,
    yRatio: 51.2,
  },
  {
    refNo: '15',
    partNo: '08319-3108A-000',
    partName: 'NUT',
    qty: 1,
    price: null,
    xRatio: 16.2,
    yRatio: 51.6,
  },
  {
    refNo: '16',
    partNo: '01550-0825A-000',
    partName: 'BOLT',
    qty: 2,
    price: 31,
    xRatio: 84.3,
    yRatio: 29.0,
  },
  {
    refNo: '17',
    partNo: '18213-12K01-000',
    partName: 'SENSOR,OXYGEN',
    qty: 1,
    price: 2840,
    xRatio: 87.0,
    yRatio: 33.7,
  },
  {
    refNo: '18',
    partNo: '36990-25G00-000',
    partName: 'CLAMP (L:95)',
    qty: 1,
    price: 121,
    xRatio: 94.5,
    yRatio: 34.6,
  },
];
