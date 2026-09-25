import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.355A (1-E-5) HANDLE SWITCH (FU150RFM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-handle-switch-fu150rfm5_p31-fig-355a-1-e-5/
 * (3 rows, no variant groups, all priced). Two clamps (refNo 3, qty 2) each print their own "3"
 * label on the diagram (one per switch sub-assembly); the top/clearer occurrence was used, per
 * the RADIATOR_HOSE precedent. xRatio/yRatio measured with the pixel-blob-detection technique
 * (see catalogue-cylinder-head-cover.data.ts / project_chardworkz_catalogue_schematic_process
 * memory) and dot-overlay verified.
 */
export const HANDLE_SWITCH_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '37200-12KA0-000',
    partName: 'SWITCH ASSY, HANDLE RH',
    qty: 1,
    price: 1566,
    xRatio: 45.07,
    yRatio: 51.59,
  },
  {
    refNo: '2',
    partNo: '37400-12KA0-000',
    partName: 'SWITCH ASSY, HANDLE LH',
    qty: 1,
    price: 1566,
    xRatio: 61.81,
    yRatio: 22.88,
  },
  {
    refNo: '3',
    partNo: '09407-14407-000',
    partName: 'CLAMP (L:145)',
    qty: 2,
    price: 14,
    xRatio: 84.72,
    yRatio: 26.46,
  },
];
