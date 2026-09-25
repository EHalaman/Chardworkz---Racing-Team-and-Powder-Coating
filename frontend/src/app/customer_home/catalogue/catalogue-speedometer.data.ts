import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.330A (1-D-7) SPEEDOMETER (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-speedometer-fu150rfm5_p31-fig-330a-1-d-7/
 * (6 rows, no variant groups; refNo 1 has no price on the live site itself - a real gap, not a
 * scraping miss). refNo 2 (CUSHION,SPEEDOMETER, qty 3) prints twice on the diagram; the
 * top-right/clearer occurrence was used, per the RADIATOR_HOSE precedent. xRatio/yRatio
 * measured with the pixel-blob-detection technique in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory) and dot-overlay verified - all 6
 * landed exactly on their printed digits on the first verification pass.
 */
export const SPEEDOMETER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '34100-12K01-000',
    partName: 'SPEEDOMETER ASSY',
    qty: 1,
    price: null,
    xRatio: 47.53,
    yRatio: 22.78,
  },
  {
    refNo: '2',
    partNo: '34189-30H30-000',
    partName: 'CUSHION,SPEEDOMETER',
    qty: 3,
    price: 52,
    xRatio: 81.69,
    yRatio: 49.66,
  },
  {
    refNo: '3',
    partNo: '09160-04026-000',
    partName: 'WASHER (4.5X16X1.2)',
    qty: 1,
    price: 85,
    xRatio: 83.33,
    yRatio: 54.58,
  },
  {
    refNo: '4',
    partNo: '03541-0416A-000',
    partName: 'SCREW',
    qty: 1,
    price: 31,
    xRatio: 85.28,
    yRatio: 59.2,
  },
  {
    refNo: '5',
    partNo: '34990-12K00-000',
    partName: 'SENSOR,SPEED',
    qty: 1,
    price: 992,
    xRatio: 31.61,
    yRatio: 77.22,
  },
  {
    refNo: '6',
    partNo: '07130-0512A-000',
    partName: 'BOLT',
    qty: 1,
    price: 32,
    xRatio: 21.75,
    yRatio: 72.59,
  },
];
