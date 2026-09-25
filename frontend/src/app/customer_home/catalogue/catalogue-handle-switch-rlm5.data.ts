import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.355B (1-E-6) HANDLE SWITCH (FU150RLM5_P31), scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-handle-switch-fu150rlm5_p31-fig-355b-1-e-6/
 * (3 rows, identical part numbers/prices to the FU150RFM5_P31 variant's FIG.355A). refNo 3
 * (CLAMP, qty 2) prints twice on the diagram; the top/clearer occurrence was used, per the
 * RADIATOR_HOSE precedent. xRatio/yRatio measured with the pixel-blob/tight-crop technique in
 * natural-image pixel space (see project_chardworkz_catalogue_schematic_process memory) and
 * dot-overlay verified - all 3 landed exactly on their printed digits.
 */
export const HANDLE_SWITCH_RLM5_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '37200-12KA0-000',
    partName: 'SWITCH ASSY, HANDLE RH',
    qty: 1,
    price: 1566,
    xRatio: 50.24,
    yRatio: 50.88,
  },
  {
    refNo: '2',
    partNo: '37400-12KA0-000',
    partName: 'SWITCH ASSY, HANDLE LH',
    qty: 1,
    price: 1566,
    xRatio: 65.59,
    yRatio: 26.47,
  },
  {
    refNo: '3',
    partNo: '09407-14407-000',
    partName: 'CLAMP (L:145)',
    qty: 2,
    price: 14,
    xRatio: 89.06,
    yRatio: 25.67,
  },
];
