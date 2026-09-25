import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.496E (1-E-11) LABEL, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-label-fig-496e-1-e-11/
 * (parts table + diagram image). xRatio/yRatio measured with the same canvas pixel-centroid
 * technique as catalogue-cylinder-head-cover.data.ts: scoped blob search around each label's
 * approximate on-screen position, picked the compact digit-glyph blob (~4-6px wide, ~10px tall,
 * density ~0.5) over the thicker leader-line/border pixels also present, then confirmed by
 * plotting a marker back onto the live page and visually checking it lands on the printed digit.
 */
export const LABEL_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '68319-40J00-000',
    partName: 'LABEL,GENERAL WARNING',
    qty: 1,
    price: 48,
    xRatio: 27,
    yRatio: 13,
  },
  {
    refNo: '2',
    partNo: '68332-12K20-000',
    partName: 'LABEL,TIRE INFORMATION',
    qty: 1,
    price: 38,
    xRatio: 71,
    yRatio: 74,
  },
  {
    refNo: '3',
    partNo: '99011-12K57-31A',
    partName: "MANUAL,OWNER'S",
    qty: 1,
    price: null,
    xRatio: 79,
    yRatio: 12,
  },
];
