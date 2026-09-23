import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.102A (1-B-2) CYLINDER HEAD COVER, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-cylinder-head-cover-fig-102a-1-b-2/
 * (both the parts table and the diagram image itself, hotlinked directly from Suzuki PH's own
 * media library rather than re-hosting a copy - the image URL lives on this figure's own entry
 * in catalogue-figures.data.ts). This is the first figure with real per-part hotspot data - see
 * that file's CatalogueFigure.diagramParts for how a figure opts into the detail view.
 */

/**
 * xRatio/yRatio mark the pixel centroid of the diagram's own printed "1"-"5" number label
 * (not the far end of its leader line, not a guess). Measured programmatically, not eyeballed:
 * fetched the real 669x1038 image into a canvas, found connected dark-pixel components within
 * each label's neighborhood, and picked the compact ~6x10px digit-glyph-shaped blob over the
 * thin 1px leader-line pixels also in that neighborhood - then confirmed by plotting a marker
 * at each result back onto the image and visually checking it lands on the printed digit.
 *
 * This caught a real, previously-unnoticed error in refNo 1/3/4/5's own prior "verified"
 * coordinates (only refNo 2 was actually correct) - e.g. refNo 1 was at xRatio 5 (the true left
 * margin) when the real "1" label sits at xRatio ~16, more centrally placed. Two later external
 * proposals both correctly flagged that hotspots looked misaligned, but each supplied its own
 * guessed replacement coordinates instead of measuring the real image - both were checked and
 * rejected (one also misdescribed refNo 2, which was already correct, as needing a change).
 */
export const CYLINDER_HEAD_COVER_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '11171-12K00-000',
    partName: 'COVER, CYLINDER HEAD',
    qty: 1,
    price: 2131,
    xRatio: 16,
    yRatio: 40,
  },
  {
    refNo: '2',
    partNo: '11173-12K00-000',
    partName: 'GASKET, CYL HEAD COVER NO.1',
    qty: 1,
    price: 269,
    xRatio: 16,
    yRatio: 59,
  },
  {
    refNo: '3',
    partNo: '11178-12K00-000',
    partName: 'GASKET, CYL HEAD COVER',
    qty: 1,
    price: 56,
    xRatio: 59,
    yRatio: 59,
  },
  {
    refNo: '4',
    partNo: '09106-07025-000',
    partName: 'BOLT (7X12)',
    qty: 2,
    price: 40,
    xRatio: 31,
    yRatio: 20,
  },
  {
    refNo: '5',
    partNo: '11191-27E70-000',
    partName: 'WASHER (10.6X25.5X1.6)',
    qty: 2,
    price: 52,
    xRatio: 31,
    yRatio: 25,
  },
];
