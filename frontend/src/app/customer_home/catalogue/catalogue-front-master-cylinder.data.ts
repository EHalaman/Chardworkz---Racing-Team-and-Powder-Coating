import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.537A (1-F-4) FRONT MASTER CYLINDER, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-master-cylinder-fig-537a-1-f-4/
 * (10 rows, no variant groups). refNo 10 (.PROTECTOR) has no price on the live site itself - a
 * real gap, not a scraping miss. xRatio/yRatio measured by direct dark-pixel cluster scanning
 * on canvas ImageData in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory) - manual grid-label reading on this
 * figure repeatedly produced wrong coordinates (crop-origin/scale mixups caught only by
 * cross-checking against automated region scans), so every position here came from scanning
 * small search windows for the actual dark-pixel centroid rather than eyeballing a grid.
 */
export const FRONT_MASTER_CYLINDER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '59600-21D70-000',
    partName: 'CYLINDER ASSY,FR MASTER',
    qty: 1,
    price: 6208,
    xRatio: 81.76,
    yRatio: 48.46,
  },
  {
    refNo: '2',
    partNo: '59600-21810-000',
    partName: '.PISTON & CUP SET',
    qty: 1,
    price: 1501,
    xRatio: 29.3,
    yRatio: 50.1,
  },
  {
    refNo: '3',
    partNo: '59666-44300-000',
    partName: '.BOOT',
    qty: 1,
    price: 131,
    xRatio: 18.69,
    yRatio: 39.98,
  },
  {
    refNo: '4',
    partNo: '59667-44B00-000',
    partName: '.DIAPHRAGM',
    qty: 1,
    price: 291,
    xRatio: 57.99,
    yRatio: 48.36,
  },
  {
    refNo: '5',
    partNo: '59669-21D20-000',
    partName: '.CAP',
    qty: 1,
    price: 187,
    xRatio: 57.99,
    yRatio: 35.84,
  },
  {
    refNo: '6',
    partNo: '59668-21D20-000',
    partName: '.PLATE,DIAPHRAGM',
    qty: 1,
    price: 35,
    xRatio: 58.15,
    yRatio: 42.1,
  },
  {
    refNo: '7',
    partNo: '69689-49300-000',
    partName: '.SCREW,RESERVOIR CAP',
    qty: 2,
    price: 27,
    xRatio: 65.17,
    yRatio: 30.54,
  },
  {
    refNo: '8',
    partNo: '59671-36500-000',
    partName: '.HOLDER',
    qty: 1,
    price: 82,
    xRatio: 67.86,
    yRatio: 49.23,
  },
  {
    refNo: '9',
    partNo: '59675-02FA0-000',
    partName: '.BOLT (6X22)',
    qty: 2,
    price: 118,
    xRatio: 74.14,
    yRatio: 46.24,
  },
  {
    refNo: '10',
    partNo: '59664-32F00-000',
    partName: '.PROTECTOR',
    qty: 1,
    price: null,
    xRatio: 48.28,
    yRatio: 47.4,
  },
];
