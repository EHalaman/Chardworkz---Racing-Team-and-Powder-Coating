---
title: "Raider R150 FI — Engines and Body Parts Catalog Summary"
type: reference-summary
status: draft
created: 2026-09-20
updated: 2026-09-20
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Source

`RELATED DOCUMENTS/Suzuki-Raider-150-FI Engines and body parts.pdf` — the official Suzuki genuine-parts catalogue for the FU150MF-Q / FU150MFX-Q (Raider R150 FI), spec code E14, 1st edition (2016-12), part no. 9900B-12K00-000. 81 pages, organized as exploded-diagram figures ("FIG.xxx") each with a REF.NO / PART NO. / DESCRIPTION table.

This is a different, much more exhaustive document than `RELATED DOCUMENTS/770452473-Raider-150-Fi.pdf` (the owner's manual already used for `V4__seed_raider_parts.sql`'s 17 seeded products). This one is the full OEM parts breakdown, not a curated common-parts list.

# What was extracted

Text was pulled with `pdftotext` (no layout mode — the exploded-diagram + table layout garbles under `-layout`) and parsed into structured (FIG section → REF NO, PART NO, DESCRIPTION) rows.

- **68 FIG sections**, grouped by catalogue section letter:

  | Group | Scope                                                                                                                                                                                             | FIG sections | Parsed part lines |
  | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------- |
  | B     | Engine top-end (cylinder head, crankcase, crankshaft, camshaft/valve, cam chain)                                                                                                                  | 14           | 176               |
  | C     | Engine bottom-end + fuel/cooling/electrical-start (throttle body, air cleaner, muffler, oil/fuel/water pump, clutch, transmission, gear shifting, kick starter, starting motor, magneto, battery) | 16           | 202               |
  | D     | Electrical + frame + body shell (electrical, speedometer, headlamp, rear combination lamp, wiring harness, lock set, handle switch, frame, stand, fuel tank, frame cover, headlamp housing)       | 16           | 170               |
  | E     | Front body/suspension/brakes (front fender, handlebar, handle lever, rear fender, cowling, front box, label, seat, front fork, steering stem, front wheel, front caliper, front brake hose)       | 17           | 224               |
  | F     | Rear suspension/brakes (front master cylinder, rear swingarm, rear wheel, rear caliper, rear master cylinder)                                                                                     | 5            | 82                |

- **696 unique part numbers** cleanly parsed → full list at `RELATED DOCUMENTS/Raider150FI_EnginesBodyParts_FullPartsList.csv` (part_no, description, section, fig code).
- **10 FIG sections (~128 additional part refs)** — Cylinder (block), Muffler, Oil Pump, Radiator, Clutch, Battery, Lock Set, Frame, Stand, Seat — extracted as a single run-on line instead of one row per part, so ref numbers and part numbers are recoverable but not reliably paired with individual descriptions. Not included in the CSV; would need a manual pass against the PDF if any of these specific parts are wanted.

# Cross-check against the already-seeded 17 products

`V4__seed_raider_parts.sql`'s 17 products (name-only, no OEM part numbers, placeholder prices) now have confirmed real OEM part numbers in this catalog, e.g.:

- NGK MR8E-9 Spark Plug → `09482-00646-000` (Cylinder Head, FIG.103A)
- Front/Rear Brake Pad Set, Front/Rear Brake Hose, Chain, Air Cleaner Element, Oil Filter, Clutch Plate Set, Valve Springs, Throttle/Clutch Cable — all have matches in the sections above.

This catalog could be used to backfill real OEM part numbers onto the existing 17 products, separately from adding new ones.

# Candidate stockable/consumable parts (beyond the existing 17)

The full 696-part catalog is a complete vehicle teardown list — most of it (crankshaft assemblies, cylinder heads, individual bolts/washers/pins for engine reassembly) is not something a retail/service counter would stock as discrete sellable SKUs. Filtering by keyword (spark plugs, filters, bulbs, bearings, oil seals, O-rings on serviceable assemblies, cables, chain/sprockets, brake pads/hoses/discs, tires, mirrors, grips/levers, footrest hardware) narrowed this to **103 realistic candidate parts** → `RELATED DOCUMENTS/Raider150FI_CandidateStockableParts.csv`.

Examples: bulbs (headlamp 12V10W, tail 12V18/5W, turn 12V5W), wheel/steering bearings and oil seals, front/rear brake discs, front/rear tires, throttle/clutch cables and grips, rear-view mirrors, brake/clutch levers, cam chain + tensioner, drive/cam sprockets, spark plug cap/seal, fuses, footrest hardware.

This list still has **no pricing** (the catalog is parts-identity only, same limitation as V4) and includes some noise (e.g. generic "BEARING" appears multiple times across assemblies with no distinguishing size in the description) that would benefit from a manual pass before turning into real product rows.

# Open question — not yet acted on

Nothing has been written to the database or added as a product yet. Before generating any `V__seed_*` migration or using the Products screen to add these:

1. **Scope**: which of the 103 candidates (or a different cut) should actually become sellable/stockable products — vs. staying informational catalog data?
2. **Pricing**: same placeholder-price problem as `V4` — real prices need to come from the business owner or a supplier price list, not be guessed.
3. **Backfill vs. new**: should the existing 17 products get their real OEM part numbers backfilled (e.g. a new `product.oem_part_no` column) as well, or is that out of scope for now?
