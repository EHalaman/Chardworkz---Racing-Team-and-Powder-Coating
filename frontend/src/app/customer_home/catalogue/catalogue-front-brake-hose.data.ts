import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.536A (1-F-3) FRONT BRAKE HOSE, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-front-brake-hose-fig-536a-1-f-3/
 * (5 rows, no variant groups, all priced). refNo 1 (BOLT,BRAKE FLUID, qty 2) and refNo 2
 * (WASHER, qty 4) each print at two banjo fittings (top and bottom of the hose) plus one extra
 * washer icon at the top fitting; the clearest, least-overlapping occurrence of each was used,
 * per the RADIATOR_HOSE/FRONT_BOX precedent. xRatio/yRatio measured via pixel-blob/grid-overlay
 * crops rendered directly from canvas ImageData in natural-image pixel space (see
 * project_chardworkz_catalogue_schematic_process memory) - this avoided the screenshot/zoom
 * scale drift documented for this session, and every position was confirmed by re-rendering all
 * five marker dots together onto the full diagram and visually verifying each lands on its
 * intended icon.
 */
export const FRONT_BRAKE_HOSE_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '59492-40J00-000',
    partName: 'BOLT,BRAKE FLUID',
    qty: 2,
    price: 190,
    xRatio: 67.27,
    yRatio: 25.53,
  },
  {
    refNo: '2',
    partNo: '09168-10033-000',
    partName: 'WASHER (10.2X15X1.4)',
    qty: 4,
    price: 69,
    xRatio: 59.64,
    yRatio: 19.65,
  },
  {
    refNo: '3',
    partNo: '59480-12K30-000',
    partName: 'HOSE,FRONT BRAKE',
    qty: 1,
    price: 1258,
    xRatio: 49.03,
    yRatio: 40.27,
  },
  {
    refNo: '4',
    partNo: '59268-19D60-000',
    partName: 'CLAMP,FR BK HOSE LOWER',
    qty: 1,
    price: 52,
    xRatio: 40.36,
    yRatio: 61.66,
  },
  {
    refNo: '5',
    partNo: '01547-0610A-000',
    partName: 'BOLT',
    qty: 1,
    price: 32,
    xRatio: 34.38,
    yRatio: 61.47,
  },
];
