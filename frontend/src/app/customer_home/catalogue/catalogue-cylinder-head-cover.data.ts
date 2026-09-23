export interface CylinderHeadCoverPart {
  refNo: number;
  partNo: string;
  partName: string;
  qty: number;
  price: number;
  xRatio: number; // % X offset on the diagram image
  yRatio: number; // % Y offset on the diagram image
}

/**
 * Real parts list and diagram for FIG.102A (1-B-2) CYLINDER HEAD COVER, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-cylinder-head-cover-fig-102a-1-b-2/
 * (both the parts table and the diagram image itself, hotlinked directly from Suzuki PH's own
 * media library rather than re-hosting a copy). This is the only figure with real per-part
 * hotspot data today - the other 60 figures in catalogue-figures.data.ts only have a title/
 * code/link, not a diagram+parts breakdown, so their cards stay link-out-only until the same
 * verification work is done for them.
 */
export const CYLINDER_HEAD_COVER_DIAGRAM =
  'https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0011.jpg';

/**
 * xRatio/yRatio were measured directly against the real diagram image (zoomed screenshots of
 * https://mc.suzuki.com.ph/wp-content/uploads/2024/09/FU150MFXM3_P31Final_page-0011.jpg,
 * cross-checked against its own reported bounding box), not estimated/guessed - they mark
 * where the diagram's own printed "1"-"5" labels actually sit. Both this project's own earlier
 * guess and an external proposal's guessed coordinates were checked against the real image and
 * were wrong (the proposal's values imply a mostly-empty bottom half; the actual gasket sits
 * around mid-image, not near the bottom) - not used.
 */
export const CYLINDER_HEAD_COVER_PARTS: CylinderHeadCoverPart[] = [
  {
    refNo: 1,
    partNo: '11171-12K00-000',
    partName: 'COVER, CYLINDER HEAD',
    qty: 1,
    price: 2131,
    xRatio: 5,
    yRatio: 39,
  },
  {
    refNo: 2,
    partNo: '11173-12K00-000',
    partName: 'GASKET, CYL HEAD COVER NO.1',
    qty: 1,
    price: 269,
    xRatio: 16,
    yRatio: 58,
  },
  {
    refNo: 3,
    partNo: '11178-12K00-000',
    partName: 'GASKET, CYL HEAD COVER',
    qty: 1,
    price: 56,
    xRatio: 66,
    yRatio: 58,
  },
  {
    refNo: 4,
    partNo: '09106-07025-000',
    partName: 'BOLT (7X12)',
    qty: 2,
    price: 40,
    xRatio: 28,
    yRatio: 17,
  },
  {
    refNo: 5,
    partNo: '11191-27E70-000',
    partName: 'WASHER (10.6X25.5X1.6)',
    qty: 2,
    price: 52,
    xRatio: 28,
    yRatio: 22,
  },
];
