import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.401A (1-E-7) FRAME (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-frame-fu150rfm5_p31-fig-401a-1-e-7/
 * (8 rows, no variant groups; refNo 7 has no price on the live site itself - a real gap, not a
 * scraping miss). Real site data-quality bug, resolved rather than reproduced: the live page's
 * own table cells for refNo 1-4 each literally contain all 8 part numbers on the page
 * concatenated together ("41100-12K60-000 41560-12K00-000 01550-0616A-000 47414-12K10-000
 * 09116-06111-000 09180-06331-000 09320-08528-000 01550-0612A-000") instead of their own single
 * part number - confirmed in the raw DOM, not a scraping artifact. refNo 5-8's cells are correct
 * single part numbers and match the LAST 4 numbers of that string in refNo order, so the first 4
 * numbers were assigned to refNo 1-4 in order (41100-12K60-000 to FRAME, 41560-12K00-000 to
 * BAND,BATTERY, 01550-0616A-000 to BOLT, 47414-12K10-000 to BRACKET,RECT FTG) - each prefix
 * matches that part's plausible Suzuki part family (41xxx frame parts, 015xx generic bolts).
 * xRatio/yRatio measured with the pixel-blob/tight-crop technique in natural-image pixel space
 * (see project_chardworkz_catalogue_schematic_process memory) and dot-overlay verified.
 */
export const FRAME_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '41100-12K60-000',
    partName: 'FRAME',
    qty: 1,
    price: 27782,
    xRatio: 38.78,
    yRatio: 17.7,
  },
  {
    refNo: '2',
    partNo: '41560-12K00-000',
    partName: 'BAND,BATTERY',
    qty: 1,
    price: 236,
    xRatio: 44.01,
    yRatio: 4.32,
  },
  {
    refNo: '3',
    partNo: '01550-0616A-000',
    partName: 'BOLT',
    qty: 2,
    price: 63,
    xRatio: 58.75,
    yRatio: 2.31,
  },
  {
    refNo: '4',
    partNo: '47414-12K10-000',
    partName: 'BRACKET, RECT FTG',
    qty: 1,
    price: 231,
    xRatio: 66.85,
    yRatio: 29.62,
  },
  {
    refNo: '5',
    partNo: '09116-06111-000',
    partName: 'BOLT (6X20)',
    qty: 1,
    price: 12,
    xRatio: 62.08,
    yRatio: 30.89,
  },
  {
    refNo: '6',
    partNo: '09116-06111-000',
    partName: 'SPACER (6.2X8.4X10.9)',
    qty: 1,
    price: 29,
    xRatio: 57.49,
    yRatio: 31.28,
  },
  {
    refNo: '7',
    partNo: '09320-08528-000',
    partName: 'CUSHION',
    qty: 1,
    price: null,
    xRatio: 60.07,
    yRatio: 32.18,
  },
  {
    refNo: '8',
    partNo: '01550-0612A-000',
    partName: 'BOLT',
    qty: 1,
    price: 12,
    xRatio: 60.07,
    yRatio: 24.88,
  },
];
