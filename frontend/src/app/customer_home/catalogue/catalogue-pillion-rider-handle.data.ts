import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.410A (1-D-9) PILLION RIDER HANDLE, verified live against
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-pillion-rider-handle-fig-410a-1-d-9/
 * (parts table + diagram image). xRatio/yRatio measured by downloading the real diagram image
 * and running the same connected-dark-pixel-component technique as
 * catalogue-cylinder-head-cover.data.ts programmatically (Node/Jimp instead of an in-browser
 * canvas - same flood-fill algorithm, same digit-glyph size/density filter), then confirmed by
 * compositing a colored marker at each candidate's centroid directly onto a cropped, upscaled
 * copy of the real image and visually checking it lands on the printed digit (not a bolt-thread
 * or circle-detail false positive - both showed up as separate candidate blobs here and were
 * rejected after this check).
 */
export const PILLION_RIDER_HANDLE_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '46211-12K00-291',
    partName: 'HANDLE,PILLION RIDER (BLACK)',
    qty: 1,
    price: 630,
    xRatio: 13,
    yRatio: 52,
  },
  {
    refNo: '2',
    partNo: '46212-12K00-000',
    partName: 'WASHER,PILLION RIDER HANDLE',
    qty: 2,
    price: 69,
    xRatio: 19,
    yRatio: 38,
  },
  {
    refNo: '3',
    partNo: '01550-0835A-000',
    partName: 'BOLT (8X35)',
    qty: 2,
    price: 31,
    xRatio: 14,
    yRatio: 31,
  },
];
