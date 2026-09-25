import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.352B (1-E-4) LOCK SET (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-lock-set-fu150rlm5_p31-fig-352b-1-e-4/
 * (5 rows: refNo 1-5, all priced). Real site inconsistency, documented rather than silently
 * fixed: this page's own <title>/breadcrumb label it "LOCK SET (FU150RLM5_P31)" and its
 * on-diagram caption reads "FIG.352A" / "FU150M5_P31_352A" - none of which match this catalogue
 * entry's own figCode/title (FIG.352B, FU150RFM5_P31) - matching the MUFFLER/ELECTRICAL
 * precedent of the live site's own labels disagreeing with the URL slug. Part names 2 and 5
 * carry a leading "." exactly as scraped (a sub-item convention used elsewhere on the site, see
 * AIR_CLEANER_PARTS). xRatio/yRatio measured with the pixel-blob-detection + iterative
 * dot-overlay technique (see project_chardworkz_catalogue_schematic_process memory) and
 * dot-overlay verified.
 */
export const LOCK_SET_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '37103-12853-000',
    partName: 'LOCK SET',
    qty: 1,
    price: 2744,
    xRatio: 83.2,
    yRatio: 64.73,
  },
  {
    refNo: '2',
    partNo: '37100-12K13-000',
    partName: '.LOCK ASSY,STEERING',
    qty: 2,
    price: 2413,
    xRatio: 57.34,
    yRatio: 71.86,
  },
  {
    refNo: '3',
    partNo: '07130-0616A-000',
    partName: 'BOLT',
    qty: 3,
    price: 74,
    xRatio: 46.97,
    yRatio: 84.04,
  },
  {
    refNo: '4',
    partNo: '37155-12811-000',
    partName: 'SHUTTER SET',
    qty: 4,
    price: 1751,
    xRatio: 75.19,
    yRatio: 27.63,
  },
  {
    refNo: '5',
    partNo: '37159-12K00-000',
    partName: '.SCREW,SHUTTER LOCK',
    qty: 5,
    price: 36,
    xRatio: 39.23,
    yRatio: 19.01,
  },
];
