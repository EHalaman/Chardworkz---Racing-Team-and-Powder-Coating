import type { CatalogueDiagramPart } from './catalogue-figures.data';

/**
 * Real parts list for FIG.312A (1-D-5) ELECTRICAL, scraped live from
 * https://mc.suzuki.com.ph/figure-part/raider-r150-fi-electrical-fu150rfm5_p31-fig-312a-1-d-5/
 * (15 rows, no variant groups; refNo 5, 3, 4, 2, 6, 8 each print twice on the diagram, the
 * clearest occurrence of each was used, per the RADIATOR_HOSE precedent). refNo 2, 5, and
 * 15 have no price on the live site (real gaps, not scraping misses). The diagram itself
 * also prints refNo 16-19 (the relay/starter-motor bracket assembly), but the live parts
 * table has no rows for them - a real site gap, not a scraping miss - so no hotspots or
 * rows are fabricated for 16-19 here. xRatio/yRatio measured with the pixel-centroid
 * technique (see catalogue-cylinder-head-cover.data.ts) and dot-overlay verified.
 */
export const ELECTRICAL_PARTS: CatalogueDiagramPart[] = [
  {
    refNo: '1',
    partNo: '32800-19K03-000',
    partName: 'RECTIFIER ASSY',
    qty: 1,
    price: 10139,
    xRatio: 82.1,
    yRatio: 65.4,
  },
  {
    refNo: '2',
    partNo: '01547-0616A-000',
    partName: 'BOLT',
    qty: 1,
    price: null,
    xRatio: 73.4,
    yRatio: 53.9,
  },
  {
    refNo: '3',
    partNo: '08316-1006A-000',
    partName: 'NUT (6X12)',
    qty: 1,
    price: 69,
    xRatio: 63.1,
    yRatio: 51.8,
  },
  {
    refNo: '4',
    partNo: '32920-12K00-000',
    partName: 'CONTROL UNIT,FI',
    qty: 1,
    price: 6705,
    xRatio: 69.4,
    yRatio: 53.1,
  },
  {
    refNo: '5',
    partNo: '33652-38000-000',
    partName: 'PROTECTOR,BATTERY (40X30X3.0)',
    qty: 2,
    price: null,
    xRatio: 54.6,
    yRatio: 53.0,
  },
  {
    refNo: '6',
    partNo: '33960-06G10-000',
    partName: 'SENSOR ASSY,FUEL CUT',
    qty: 1,
    price: 1288,
    xRatio: 96.5,
    yRatio: 64.1,
  },
  {
    refNo: '7',
    partNo: '33410-40J20-000',
    partName: 'COIL ASSY,IGNITION',
    qty: 1,
    price: 900,
    xRatio: 47.8,
    yRatio: 29.0,
  },
  {
    refNo: '8',
    partNo: '01547-0620B-000',
    partName: 'BOLT',
    qty: 2,
    price: 52,
    xRatio: 58.0,
    yRatio: 15.8,
  },
  {
    refNo: '9',
    partNo: '33510-25G00-000',
    partName: 'CAP,SPARK PLUG',
    qty: 1,
    price: 352,
    xRatio: 57.8,
    yRatio: 30.6,
  },
  {
    refNo: '10',
    partNo: '33541-25G00-000',
    partName: 'SEAL,SPARK PLUG',
    qty: 1,
    price: 71,
    xRatio: 45.25,
    yRatio: 10.5,
  },
  {
    refNo: '11',
    partNo: '33542-25G10-000',
    partName: 'SEAL,HIGH TENSION CORD',
    qty: 1,
    price: 152,
    xRatio: 26.2,
    yRatio: 42.6,
  },
  {
    refNo: '12',
    partNo: '31800-47E01-000',
    partName: 'RELAY ASSY,STARTING MOTOR',
    qty: 1,
    price: 4267,
    xRatio: 14.0,
    yRatio: 45.3,
  },
  {
    refNo: '13',
    partNo: '31861-47E00-000',
    partName: 'COVER',
    qty: 1,
    price: 422,
    xRatio: 65.4,
    yRatio: 74.5,
  },
  {
    refNo: '14',
    partNo: '09481-20102-000',
    partName: 'FUSE (20A)',
    qty: 2,
    price: 82,
    xRatio: 68.2,
    yRatio: 84.3,
  },
  {
    refNo: '15',
    partNo: '09128-06013-000',
    partName: 'SCREW (6X8)',
    qty: 2,
    price: null,
    xRatio: 52.9,
    yRatio: 62.4,
  },
];
