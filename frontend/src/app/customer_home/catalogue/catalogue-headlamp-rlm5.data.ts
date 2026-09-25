import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.333B (1-D-10) HEADLAMP (FU150RLM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-headlamp-fig-333b-1-d-10-fu150rlm5_p31/
 * (10 rows; refNo 10 has no price on the live site itself - a real gap, not a scraping miss).
 * Unlike the FU150RFM5_P31 variant (FIG.333A), this diagram only prints callouts for refNo 1,
 * 2, 4, 5, and one screw pair identified as refNo 9 (SCREW qty4) by part-name context - the
 * printed digit on that screw pair is genuinely ambiguous between "3" and "9" at this image's
 * resolution, and 9/SCREW fits the screw-shaped icon far better than 3/CORD ASSY (a cable),
 * resolved the same way as MUFFLER's ambiguous "3"/"8" precedent. refNo 3, 6, 7, 8, and 10 were
 * searched for exhaustively across the full diagram image but have no printed position on it -
 * a real gap between this variant's simpler diagram and its fuller parts table, not a
 * measurement miss - so xRatio/yRatio are left undefined for those 5 rows. xRatio/yRatio for
 * the 5 positioned rows were measured with the pixel-blob/tight-crop technique in natural-image
 * pixel space (see project_chardworkz_catalogue_schematic_process memory) and dot-overlay
 * verified.
 */
export const HEADLAMP_RLM5_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '35100-12K01-000',
    partName: 'LAMP ASSY,FRONT COMB',
    qty: 1,
    price: 8435,
    xRatio: 25.14,
    yRatio: 19.34,
  },
  {
    refNo: '2',
    partNo: '35121-12K01-000',
    partName: '.HEADLAMP UNIT',
    qty: 1,
    price: 7527,
    xRatio: 85.23,
    yRatio: 54.4,
  },
  {
    refNo: '3',
    partNo: '35171-12K00-000',
    partName: '.CORD ASSY',
    qty: 1,
    price: 885,
  },
  {
    refNo: '4',
    partNo: '09471-12114AS01',
    partName: '.BULB (12V10W,T13)',
    qty: 2,
    price: 116,
    xRatio: 60.08,
    yRatio: 17.07,
  },
  {
    refNo: '5',
    partNo: '35137-12K00-000',
    partName: 'CUSHION,HEADLAMP',
    qty: 1,
    price: 44,
    xRatio: 93.6,
    yRatio: 74.37,
  },
  {
    refNo: '6',
    partNo: '35137-12K10-000',
    partName: 'CUSHION',
    qty: 2,
    price: 36,
  },
  {
    refNo: '7',
    partNo: '35151-12K00-000',
    partName: 'SCREW',
    qty: 1,
    price: 71,
  },
  {
    refNo: '8',
    partNo: '09148-06026-000',
    partName: 'NUT (M6)',
    qty: 2,
    price: 209,
  },
  {
    refNo: '9',
    partNo: '03541-0516A-000',
    partName: 'SCREW',
    qty: 4,
    price: 48,
    xRatio: 92.21,
    yRatio: 43.63,
  },
  {
    refNo: '10',
    partNo: '38610-23J10-000',
    partName: 'RELAY ASSY,TURNSIGNAL',
    qty: 1,
    price: null,
  },
];
