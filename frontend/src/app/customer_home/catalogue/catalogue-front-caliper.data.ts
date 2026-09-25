import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.535A (1-F-2) FRONT CALIPER, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-caliper-fig-535a-1-f-2/
 * (17 rows, no variant groups, all priced). This is a dense, mirrored-assembly diagram: refNo 1
 * (CALIPER ASSY,FRONT) and refNo 2/3 (PISTON SET / SEAL SET,PISTON, qty 1 each) are drawn as
 * isometric grouping-box outlines rather than single icons - the chosen point sits on the box's
 * top vertex / nearest ring rather than a literal part drawing. refNo 3's ring prints twice
 * (dual-piston caliper); refNo 4 (PIN, qty 2) and its own bolt icon print once, drawn separately
 * from the main bracket cluster near the bottom of the figure. xRatio/yRatio measured via
 * grid-labeled canvas crops read directly off the printed absolute-coordinate gridlines (see
 * project_chardworkz_catalogue_schematic_process memory), then confirmed by rendering all 17
 * marker dots together onto the full diagram and visually verifying each lands on its icon -
 * this caught and fixed an initial refNo 5 (BOOT) placement error before finalizing.
 */
export const FRONT_CALIPER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '59100-25G60-000',
    partName: 'CALIPER ASSY,FRONT',
    qty: 1,
    price: 5372,
    xRatio: 39.61,
    yRatio: 9.15,
  },
  {
    refNo: '2',
    partNo: '69100-31810-000',
    partName: 'PISTON SET',
    qty: 1,
    price: 2862,
    xRatio: 45.59,
    yRatio: 37.57,
  },
  {
    refNo: '3',
    partNo: '59300-13820-000',
    partName: '..SEAL SET,PISTON',
    qty: 1,
    price: 878,
    xRatio: 54.56,
    yRatio: 41.91,
  },
  {
    refNo: '4',
    partNo: '59345-14600-000',
    partName: '.PIN',
    qty: 2,
    price: 397,
    xRatio: 77.73,
    yRatio: 71.77,
  },
  {
    refNo: '5',
    partNo: '59303-14500-000',
    partName: '.BOOT',
    qty: 1,
    price: 101,
    xRatio: 32.89,
    yRatio: 24.57,
  },
  {
    refNo: '6',
    partNo: '59386-13A00-000',
    partName: '.BOOT',
    qty: 1,
    price: 113,
    xRatio: 33.63,
    yRatio: 38.54,
  },
  {
    refNo: '7',
    partNo: '69115-31D10-000',
    partName: '.SPRING,PAD',
    qty: 1,
    price: 383,
    xRatio: 36.62,
    yRatio: 61.18,
  },
  {
    refNo: '8',
    partNo: '59121-01A00-000',
    partName: '.BLEEDER',
    qty: 1,
    price: 138,
    xRatio: 78.48,
    yRatio: 36.61,
  },
  {
    refNo: '9',
    partNo: '59122-01A00-000',
    partName: '.CAP,BLEEDER',
    qty: 1,
    price: 24,
    xRatio: 78.48,
    yRatio: 40.46,
  },
  {
    refNo: '10',
    partNo: '59387-00B20-000',
    partName: '.PIN',
    qty: 1,
    price: 536,
    xRatio: 32.14,
    yRatio: 25.05,
  },
  {
    refNo: '11',
    partNo: '59388-00B20-000',
    partName: '.NUT',
    qty: 1,
    price: 469,
    xRatio: 7.47,
    yRatio: 19.75,
  },
  {
    refNo: '12',
    partNo: '59314-13A00-000',
    partName: 'WASHER',
    qty: 1,
    price: 24,
    xRatio: 18.68,
    yRatio: 34.2,
  },
  {
    refNo: '13',
    partNo: '59382-13A00-000',
    partName: '.BOLT',
    qty: 1,
    price: 120,
    xRatio: 25.41,
    yRatio: 36.61,
  },
  {
    refNo: '14',
    partNo: '59351-21D00-000',
    partName: '.BRACKET',
    qty: 1,
    price: 787,
    xRatio: 22.12,
    yRatio: 20.52,
  },
  {
    refNo: '15',
    partNo: '59100-25860-000',
    partName: '.PAD SHIM SET',
    qty: 1,
    price: 882,
    xRatio: 51.57,
    yRatio: 69.85,
  },
  {
    refNo: '16',
    partNo: '69132-31D00-000',
    partName: '..SHIM',
    qty: 1,
    price: 327,
    xRatio: 62.78,
    yRatio: 71.77,
  },
  {
    refNo: '17',
    partNo: '01550-0825A-000',
    partName: 'BOLT',
    qty: 2,
    price: 31,
    xRatio: 43.35,
    yRatio: 9.15,
  },
];
