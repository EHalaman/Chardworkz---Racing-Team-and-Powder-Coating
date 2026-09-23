import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.170A (1-B-16) OIL PUMP, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-oil-pump-fig-170a-1-c-3/
 * (15 rows, 14 hotspot positions). xRatio/yRatio measured with the pixel-centroid technique
 * (see catalogue-cylinder-head-cover.data.ts).
 *
 * refNo 9.1/9.2 are the two oil filter variants sharing one printed "9" callout - same
 * grouping pattern as CAMSHAFT/VALVE's shim group. refNo 9.1 shows no price on the live page.
 *
 * refNo 1 (PUMP ASSY) is the mounting bracket in the driven-gear sub-assembly, not the round
 * flange near the filter housing - that flange is refNo 11 (CAP,OIL FILTER). The two digits
 * are easy to misread as each other at small size (both single bold strokes); verified by
 * plotting candidate coordinates back onto the real image before finalizing, per the standard
 * technique.
 */
export const OIL_PUMP_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '16400-12K00-000',
    partName: 'PUMP ASSY,ENGINE OIL',
    qty: 1,
    price: 463,
    xRatio: 76.7,
    yRatio: 53.2,
  },
  {
    refNo: '2',
    partNo: '16331-12K00-000',
    partName: 'GEAR,OIL PUMP DRIVEN (NT:30)',
    qty: 1,
    price: 195,
    xRatio: 51.5,
    yRatio: 47.2,
  },
  {
    refNo: '3',
    partNo: '09261-02001-000',
    partName: 'PIN (2.5X19.8)',
    qty: 1,
    price: 48,
    xRatio: 61.0,
    yRatio: 55.6,
  },
  {
    refNo: '4',
    partNo: '09280-08022-000',
    partName: 'O-RING (D:2.4,ID:7.8)',
    qty: 1,
    price: 36,
    xRatio: 48.4,
    yRatio: 70.4,
  },
  {
    refNo: '5',
    partNo: '08332-1106A-000',
    partName: 'E-RING',
    qty: 1,
    price: 74,
    xRatio: 42.4,
    yRatio: 49.1,
  },
  {
    refNo: '6',
    partNo: '01547-0630A-000',
    partName: 'BOLT',
    qty: 3,
    price: 28,
    xRatio: 66.7,
    yRatio: 49.6,
  },
  {
    refNo: '7',
    partNo: '09206-08008-000',
    partName: 'PIN (6.3X8X12)',
    qty: 3,
    price: 32,
    xRatio: 53.2,
    yRatio: 71.5,
  },
  {
    refNo: '8',
    partNo: '16520-45H01-000',
    partName: 'STRAINER,ENG OIL',
    qty: 1,
    price: 117,
    xRatio: 76.0,
    yRatio: 75.8,
  },
  {
    refNo: '9.1',
    partNo: '16510-45H10-000',
    partName: 'FILTER,ENGINE OIL',
    qty: 1,
    price: null,
    xRatio: 55.5,
    yRatio: 28.0,
  },
  {
    refNo: '9.2',
    partNo: '16510-45H20-000',
    partName: 'FILTER,ENGINE OIL',
    qty: 1,
    price: 85,
    xRatio: 55.5,
    yRatio: 28.0,
  },
  {
    refNo: '10',
    partNo: '09280-54001-000',
    partName: 'O-RING (D:2.4,ID:52.6)',
    qty: 1,
    price: 31,
    xRatio: 36.6,
    yRatio: 19.7,
  },
  {
    refNo: '11',
    partNo: '16512-22J30-000',
    partName: 'CAP,OIL FILTER',
    qty: 1,
    price: 669,
    xRatio: 29.4,
    yRatio: 16.6,
  },
  {
    refNo: '12',
    partNo: '09280-13010-000',
    partName: 'O-RING (D:1.9,ID:12.5)',
    qty: 1,
    price: 15,
    xRatio: 61.0,
    yRatio: 43.1,
  },
  {
    refNo: '13',
    partNo: '16519-09J00-000',
    partName: 'SPRING,OIL FILTER',
    qty: 1,
    price: 24,
    xRatio: 43.0,
    yRatio: 26.4,
  },
  {
    refNo: '14',
    partNo: '01547-0620B-000',
    partName: 'BOLT',
    qty: 2,
    price: 52,
    xRatio: 17.0,
    yRatio: 15.2,
  },
];
