import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.301A (1-C-14) STARTING MOTOR, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-starting-motor-fig-301a-1-c-14/
 * (14 rows, no variant groups, all priced). refNo 3, 6, and 9 each print twice on the diagram
 * (matching their qty of 2, 4, and 2 respectively); the clearer/more isolated occurrence of
 * each was used, per the RADIATOR_HOSE precedent. xRatio/yRatio measured with the
 * pixel-blob-detection technique in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory) and dot-overlay verified.
 */
export const STARTING_MOTOR_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '31100-12K02-000',
    partName: 'MOTOR ASSY,STARTING',
    qty: 1,
    price: 3498,
    xRatio: 69.2,
    yRatio: 16.21,
  },
  {
    refNo: '2',
    partNo: '31130-12K00-000',
    partName: 'BRUSH TERMINAL SET',
    qty: 1,
    price: 676,
    xRatio: 60.81,
    yRatio: 30.0,
  },
  {
    refNo: '3',
    partNo: '31132-12K00-000',
    partName: '.BRUSH HOLDER SET',
    qty: 2,
    price: 434,
    xRatio: 90.17,
    yRatio: 40.53,
  },
  {
    refNo: '4',
    partNo: '31133-12K00-000',
    partName: '.HOLDER,BRUSH',
    qty: 1,
    price: 367,
    xRatio: 81.78,
    yRatio: 38.24,
  },
  {
    refNo: '5',
    partNo: '31134-12K00-000',
    partName: '.SCREW',
    qty: 2,
    price: 71,
    xRatio: 91.85,
    yRatio: 42.98,
  },
  {
    refNo: '6',
    partNo: '31135-05530-000',
    partName: '.SPRING',
    qty: 4,
    price: 11,
    xRatio: 68.15,
    yRatio: 35.41,
  },
  {
    refNo: '7',
    partNo: '31156-12K00-000',
    partName: '.O-RING',
    qty: 2,
    price: 71,
    xRatio: 46.25,
    yRatio: 81.95,
  },
  {
    refNo: '8',
    partNo: '31170-12K00-000',
    partName: '.WASHER SET',
    qty: 1,
    price: 250,
    xRatio: 15.73,
    yRatio: 43.65,
  },
  {
    refNo: '9',
    partNo: '31264-05530-000',
    partName: '.O RING',
    qty: 2,
    price: 23,
    xRatio: 30.75,
    yRatio: 80.13,
  },
  {
    refNo: '10',
    partNo: '31281-12K00-000',
    partName: '.BOLT',
    qty: 2,
    price: 321,
    xRatio: 59.37,
    yRatio: 88.59,
  },
  {
    refNo: '11',
    partNo: '08310-12K00-000',
    partName: '.NUT',
    qty: 1,
    price: 68,
    xRatio: 57.67,
    yRatio: 20.0,
  },
  {
    refNo: '12',
    partNo: '09280-12K00-000',
    partName: '.O-RING',
    qty: 1,
    price: 225,
    xRatio: 58.72,
    yRatio: 71.33,
  },
  {
    refNo: '13',
    partNo: '01547-0625A-000',
    partName: 'BOLT',
    qty: 2,
    price: 52,
    xRatio: 13.63,
    yRatio: 13.51,
  },
  {
    refNo: '14',
    partNo: '08361-3506A-000',
    partName: 'NUT',
    qty: 1,
    price: 14,
    xRatio: 53.47,
    yRatio: 9.86,
  },
];
