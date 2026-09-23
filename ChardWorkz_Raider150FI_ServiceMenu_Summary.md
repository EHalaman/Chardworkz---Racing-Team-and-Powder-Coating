---
title: "Raider R150 FI — Service Menu Summary"
type: reference-summary
status: draft
created: 2026-09-21
updated: 2026-09-21
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Source

`RELATED DOCUMENTS/RAIDER_FI_SERVICES.md` — "Suzuki Raider R150 FI Master Workshop Service Menu" (v1.0.0, Official Specification). Standard operating requirement stated in the doc: every service must use 100% Suzuki Genuine Parts (SGP) and Suzuki Ecstar fluids — no aftermarket parts or non-spec fluids, to preserve warranty compliance and DOHC tolerances.

20 services across 4 categories, each with a materials list (real OEM part numbers) and a stated purpose. This app has no service-to-parts recipe/BOM system — a service is a flat labor charge in the `product` table (`category = 'SERVICES'`), and the parts it consumes are sold separately as their own product rows (most already exist from `V4`/`V15`).

# What was added (migration `V16`)

**3 existing services renamed/repriced in place** (per the user's explicit choice, to avoid near-duplicate options in the POS list):

| Old name            | New name                                             | Old price | New price |
| ------------------- | ---------------------------------------------------- | --------- | --------- |
| CHANGE OIL SERVICE  | Engine Oil & Filter Service                          | ₱75       | ₱150      |
| Fi Cleaning Service | Throttle Body Service & Ultrasonic Injector Cleaning | ₱350      | ₱400      |
| Change Fuel Filter  | Fuel Pump Filter Replacement                         | ₱150      | ₱180      |

**17 new services added:**

_Preventive Maintenance:_ Spark Plug Replacement, Air Cleaner Element Service, Drive Chain & Sprocket Replacement, Radiator Coolant Flush & Refill

_Brake & Suspension:_ Front Brake Caliper & Fluid Service, Rear Brake Master Cylinder Overhaul, Front Fork Re-fluid & Seal Overhaul, Steering Head Stem Bearing (Ball Race) Replacement, Rear Swingarm & Wheel Hub Bushing Service

_Engine & Transmission Overhaul:_ Cylinder Head Top-Overhaul & Carbon Cleaning, Cylinder & Piston Kit Replacement, Clutch System Renewal, Cam Chain & Tensioner Replacement, Full Crankcase Engine Bottom-End Overhaul

_FI & Electrical:_ Water Pump Seal & Shaft Rebuild, Starter Motor Carbon Brush Overhaul, Charging System & Magneto Stator Service

All 20 are `brand_tag = 'SGP'`, `category = 'SERVICES'` (excluded from stock tracking — "always available", per the existing `DEC-038` convention). **Prices are AI-estimated placeholders**, calibrated against this shop's own pre-existing real service prices (₱75–₱3500 range) — correct via the Products screen before relying on them for a real sale.

# Bonus fix (migration `V17`)

The doc's materials lists confirmed 2 real OEM part numbers that couldn't be matched last session:

- **Oil Filter Element** → `16510-45H10-000`
- **Paper Air Cleaner Element** → `13780-12K00-000`

The second one turned out to be the exact same part as a product `V15` had already added under a different name ("Air Cleaner Filter Assembly (Complete)") — an accidental duplicate, not two real parts. Confirmed via `psql` that the duplicate had zero sales/receiving history before removing it in `V17`.

# Full materials reference (per service)

See `RELATED DOCUMENTS/RAIDER_FI_SERVICES.md` directly for the complete materials-needed lists and purpose text per service — not duplicated here since the source document already has it in full and is the canonical reference.

# Open items

1. Correct all 20 services' placeholder labor prices against real shop rates
2. If a service-to-parts "what this consumes" link is ever wanted in the app (e.g. auto-suggesting the relevant parts when a service is rung up), that's a new feature — no such linkage exists today, each service and its parts are independent `product` rows
