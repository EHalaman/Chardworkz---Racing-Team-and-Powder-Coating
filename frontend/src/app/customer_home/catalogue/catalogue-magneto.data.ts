import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.303A (1-C-13) MAGNETO, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-magneto-fig-303a-1-c-13/
 * (9 rows, no variant groups; refNo 4 and 9 have no price on the live site itself - a real
 * gap, not a scraping miss). refNo 7 and 8 both use the same part number
 * (07130-0512A-000, a BOLT) but are separate diagram positions with different qty (2 vs 1),
 * not a variant group. xRatio/yRatio measured with the pixel-blob-detection + dot-overlay
 * technique (see project_chardworkz_catalogue_schematic_process memory) and dot-overlay
 * verified.
 */
export const MAGNETO_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '32101-12K11-000',
    partName: 'STATOR ASSY,MAGNETO',
    qty: 1,
    price: 3859,
    xRatio: 66.85,
    yRatio: 23.03,
  },
  {
    refNo: '2',
    partNo: '32102-12K00-000',
    partName: 'ROTOR ASSY,MAGNETO',
    qty: 1,
    price: 5046,
    xRatio: 31.64,
    yRatio: 4.4,
  },
  {
    refNo: '3',
    partNo: '32371-12K00-000',
    partName: 'CLAMP,MAGNETO LEAD',
    qty: 1,
    price: 36,
    xRatio: 60.33,
    yRatio: 12.6,
  },
  {
    refNo: '4',
    partNo: '32371-16H00-000',
    partName: 'CLAMP,MAGNETO LEAD',
    qty: 1,
    price: null,
    xRatio: 86.56,
    yRatio: 53.61,
  },
  {
    refNo: '5',
    partNo: '09159-14037-000',
    partName: 'NUT',
    qty: 1,
    price: 52,
    xRatio: 51.39,
    yRatio: 39.5,
  },
  {
    refNo: '6',
    partNo: '09420-03008-000',
    partName: 'KEY',
    qty: 1,
    price: 56,
    xRatio: 45.83,
    yRatio: 36.59,
  },
  {
    refNo: '7',
    partNo: '07130-0512A-000',
    partName: 'BOLT',
    qty: 2,
    price: 32,
    xRatio: 51.4,
    yRatio: 65.66,
  },
  {
    refNo: '8',
    partNo: '07130-0512A-000',
    partName: 'BOLT',
    qty: 1,
    price: 32,
    xRatio: 40.12,
    yRatio: 12.59,
  },
  {
    refNo: '9',
    partNo: '07130-0535A-000',
    partName: 'BOLT',
    qty: 3,
    price: null,
    xRatio: 60.27,
    yRatio: 21.83,
  },
];
