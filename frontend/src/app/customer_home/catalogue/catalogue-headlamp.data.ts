import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.333A (1-D-9) HEADLAMP (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-headlamp-fig-333a-1-d-9/
 * (6 rows: refNo 1, 5, 6, 7, 8, 9 - all priced). The diagram itself also prints refNo 2, 3, 4,
 * and 10 (the wiring harness/connector and bulb sub-parts), but the live parts table has no
 * rows for them - a real site gap, not a scraping miss - so no hotspots/rows are fabricated for
 * them here. refNo 6 and 8 each print twice on the diagram (2 connector positions per part, qty
 * 2 each); the clearer/more isolated occurrence of each was used, per the RADIATOR_HOSE
 * precedent. xRatio/yRatio measured with the pixel-blob-detection + iterative dot-overlay
 * technique (see project_chardworkz_catalogue_schematic_process memory) and dot-overlay
 * verified.
 */
export const HEADLAMP_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '35100-12K01-000',
    partName: 'LAMP ASSY,FRONT COMB',
    qty: 1,
    price: 8435,
    xRatio: 35.72,
    yRatio: 36.08,
  },
  {
    refNo: '5',
    partNo: '35137-12K00-000',
    partName: 'CUSHION,HEADLAMP',
    qty: 1,
    price: 44,
    xRatio: 58.82,
    yRatio: 11.8,
  },
  {
    refNo: '6',
    partNo: '35137-12K10-000',
    partName: 'CUSHION',
    qty: 2,
    price: 36,
    xRatio: 43.42,
    yRatio: 17.1,
  },
  {
    refNo: '7',
    partNo: '35151-12K00-000',
    partName: 'SCREW',
    qty: 1,
    price: 71,
    xRatio: 50.11,
    yRatio: 87.66,
  },
  {
    refNo: '8',
    partNo: '09148-06026-000',
    partName: 'NUT (M6)',
    qty: 2,
    price: 209,
    xRatio: 71.23,
    yRatio: 28.56,
  },
  {
    refNo: '9',
    partNo: '03541-0516A-000',
    partName: 'SCREW',
    qty: 4,
    price: 48,
    xRatio: 66.25,
    yRatio: 81.51,
  },
];
