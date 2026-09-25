import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.530D (1-E-16) FRONT WHEEL, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-wheel-fig-530d-1-e-16/
 * (11 diagram positions; refNo "1" is a 4-way color-variant group ("1.1".."1.4" -
 * RED/BLACK/GOLD/BLUE) sharing the diagram's single printed "1" callout and xRatio/yRatio,
 * per the FRONT_FENDER_MFX precedent - 1.3/1.4 have no OEM part number on the live site itself,
 * a real gap, not a scraping miss). xRatio/yRatio measured by direct dark-pixel cluster scanning
 * on canvas ImageData in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory); refNo 8 (DISC,FRONT BRAKE) is a hollow
 * ring so its marker is the ring's bounding-box center rather than a dark-pixel centroid.
 * refNo 2/4/6 are each drawn twice (once on each side of the hub, mirrored) but share one row in
 * the parts table - the right-side (fully-labeled, includes unique refNo 7) occurrence was used
 * for their coordinates.
 */
export const FRONT_WHEEL_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1.1',
    partNo: '54111-25G80-PZW',
    partName: 'WHEEL,FR (17X1.40,RED)',
    qty: 1,
    price: 8887,
    xRatio: 62.42,
    yRatio: 52.93,
  },
  {
    refNo: '1.2',
    partNo: '54111-25G80-YPU',
    partName: 'WHEEL,FR (17X1.40,BLACK)',
    qty: 1,
    price: 10064,
    xRatio: 62.42,
    yRatio: 52.93,
  },
  {
    refNo: '1.3',
    partNo: '',
    partName: 'WHEEL,FR (17X1.40,GOLD)',
    qty: 1,
    price: 10064,
    xRatio: 62.42,
    yRatio: 52.93,
  },
  {
    refNo: '1.4',
    partNo: '',
    partName: 'WHEEL,FR (17X1.40,BLUE)',
    qty: 1,
    price: 9240,
    xRatio: 62.42,
    yRatio: 52.93,
  },
  {
    refNo: '2',
    partNo: '08113-6301B-000',
    partName: 'BEARING',
    qty: 2,
    price: 248,
    xRatio: 77.73,
    yRatio: 70.13,
  },
  {
    refNo: '3',
    partNo: '09180-12145-000',
    partName: 'SPACER (12.5X19X58)',
    qty: 1,
    price: 273,
    xRatio: 75.78,
    yRatio: 68.79,
  },
  {
    refNo: '4',
    partNo: '09285-25008-000',
    partName: 'SEAL,OIL (25X40X6)',
    qty: 2,
    price: 65,
    xRatio: 80.27,
    yRatio: 71.29,
  },
  {
    refNo: '5',
    partNo: '54711-25G00-000',
    partName: 'AXLE,FR',
    qty: 1,
    price: 231,
    xRatio: 14.22,
    yRatio: 13.15,
  },
  {
    refNo: '6',
    partNo: '54751-25G01-000',
    partName: 'SPACER,FR AXLE',
    qty: 2,
    price: 143,
    xRatio: 82.06,
    yRatio: 72.25,
  },
  {
    refNo: '7',
    partNo: '08319-3112A-000',
    partName: 'NUT',
    qty: 1,
    price: 118,
    xRatio: 84.01,
    yRatio: 73.03,
  },
  {
    refNo: '8',
    partNo: '59211-25G60-000',
    partName: 'DISC,FRONT BRAKE',
    qty: 1,
    price: 3172,
    xRatio: 38.12,
    yRatio: 17.34,
  },
  {
    refNo: '9',
    partNo: '59218-09G10-000',
    partName: 'BOLT,FR BRAKE DISC (8X21)',
    qty: 5,
    price: 56,
    xRatio: 21.72,
    yRatio: 22.95,
  },
  {
    refNo: '10',
    partNo: '55110-12K00-000',
    partName: 'TIRE,FRONT (70/90-17M/C 38P)',
    qty: 1,
    price: 4035,
    xRatio: 59.22,
    yRatio: 41.82,
  },
  {
    refNo: '11',
    partNo: '55110-12K00-000',
    partName: 'VALVE ASSY,WHEEL RIM (TR413)',
    qty: 1,
    price: 4035,
    xRatio: 51.67,
    yRatio: 80.89,
  },
];
