---
title: "ChardWorkz - final form(2).xlsx Catalog Import (V22)"
type: reference
status: active
created: 2026-09-28
updated: 2026-09-28
ai_generated: true
review_status: draft
---

# Source

Parsed from the business owner's Google Sheet "final form(2).xlsx" (2026-09-28), a customer quotation-form template with 5 print-columns of alphabetized parts plus an OTHERS bearing sub-block and a SERVICES sub-block. Seeded via backend/src/main/resources/db/migration/V22__seed_final_form_catalog.sql, applied and verified against real local Postgres the same session.

# Resolved edge cases (owner-confirmed 2026-09-28)

- **Axle Bolt front/Rear**: no price in the source form - skipped entirely, not seeded.
- **Mutarru Radiator/Race Power Radiator RFI (₱3600)**: split into two separate FI products, both at ₱3600.
- **Starter Motor Carb/FI (₱1700, single-price duplicate)**: treated as a form data-entry error and dropped; the real Carb/FI split (₱1560/₱1650) elsewhere in the form was kept.
- **Valve Spring Seat**: already existed (V15, OEM 12933-12K00-000, FI, ₱40.00). This form's ₱80 was applied as a price UPDATE to the existing row (category/OEM number untouched), not a duplicate insert.

# Full catalog (as seeded)

## CARB (23 items)

| Name | Brand | Price |
|---|---|---|
| 8 Rows oil Cooler Carb with Installation | SGP | 3500.00 |
| Air Filter (Carb) | SGP | 410.00 |
| Balancer Gear Counter (Carb) | SGP | 950.00 |
| Base Gasket (Carb) | SGP | 100.00 |
| Block 68mm Steel Carb | SGP | 3800.00 |
| Body Switch (Carb) | SGP | 450.00 |
| Break Pad Front (Carb) | SGP | 700.00 |
| Break Pad Rear (Carb) | SGP | 620.00 |
| Carbon Brush (Carb) | SGP | 350.00 |
| Clutch Cable (Carb) | SGP | 880.00 |
| Clutch Housing (Carb) | SGP | 5030.00 |
| Clutch Hub (Carb) | SGP | 490.00 |
| Elbow (Carb) | SGP | 1200.00 |
| Exhaust Valve (Carb) | SGP | 470.00 |
| Exos Pipe Set (Carb) | SGP | 3350.00 |
| Fuel Filter (Carb) | SGP | 30.00 |
| Ignition Coil Protector (Carb) | SGP | 2350.00 |
| Ignition Switch Carb | SGP | 1650.00 |
| Intake Valve (Carb) | SGP | 320.00 |
| Oil Pump (Carb) | SGP | 860.00 |
| Pressure Plate (Carb) | SGP | 770.00 |
| Starter Motor (Carb) | SGP | 1560.00 |
| Wave Washer (Carb) | SGP | 350.00 |

## FI (33 items)

| Name | Brand | Price |
|---|---|---|
| Air Filter (FI) | SGP | 470.00 |
| Balancer Gear Counter (FI) | SGP | 1220.00 |
| Base Gasket (FI) | SGP | 190.00 |
| Block 62mm Steel FI | SGP | 4500.00 |
| Block 68mm Chrome Bore FI | SGP | 6900.00 |
| Body Switch (FI) | SGP | 1880.00 |
| Break Pad Front (FI) | SGP | 830.00 |
| Break Pad Rear (FI) | SGP | 1590.00 |
| Breather Filter set FI | SGP | 750.00 |
| Carbon Brush (FI) | SGP | 660.00 |
| Clutch Cable (FI) | SGP | 500.00 |
| Clutch Housing (FI) | SGP | 5440.00 |
| Clutch Hub (FI) | SGP | 600.00 |
| Elbow (FI) | SGP | 1550.00 |
| Exhaust Valve (FI) | SGP | 450.00 |
| Exos Pipe Set (FI) | SGP | 3550.00 |
| Fuel Filter (FI) | SGP | 380.00 |
| Fuel Hose RFI | SGP | 860.00 |
| Fuel Pump RFI | SGP | 4320.00 |
| Head Gasket FI | SGP | 360.00 |
| Idle Screw FI | SGP | 150.00 |
| Ignition Coil Protector (FI) | SGP | 2550.00 |
| Ignition Switch FI | SGP | 1910.00 |
| Intake Valve (FI) | SGP | 410.00 |
| Mutarru Radiator (FI) | Mutarru | 3600.00 |
| Oil Pump (FI) | SGP | 500.00 |
| Oil Seal Water Pump Case FI | SGP | 200.00 |
| Pressure Plate (FI) | SGP | 920.00 |
| Race Power Radiator (FI) | Race Power | 3600.00 |
| Starter Motor (FI) | SGP | 1650.00 |
| Throttle Cable FI stock | SGP | 440.00 |
| Velocity Throttle Body FI | SGP | 350.00 |
| Wave Washer (FI) | SGP | 220.00 |

## OTHERS (142 items)

| Name | Brand | Price |
|---|---|---|
| Aircut | SGP | 550.00 |
| Balancer Crank | SGP | 2300.00 |
| Balancer Dumper (2pcs) | SGP | 490.00 |
| Balancer Gear Carb/FI | SGP | 1300.00 |
| Balancer Inner Race | SGP | 720.00 |
| Balancer Pin | SGP | 130.00 |
| Balancer Spring | SGP | 180.00 |
| Ball Race Carb/FI | SGP | 1620.00 |
| Bearing 6002 | Bearing | 180.00 |
| Bearing 6004 | Bearing | 250.00 |
| Bearing 6200 | Bearing | 250.00 |
| Bearing 6201 | Bearing | 160.00 |
| Bearing 6202 | Bearing | 170.00 |
| Bearing 6203 | Bearing | 180.00 |
| Bearing 6204 | Bearing | 250.00 |
| Bearing 6301 | Bearing | 170.00 |
| Block 62mm steel Carb/FI | SGP | 3500.00 |
| Bom  X Single Shifter | SGP | 5500.00 |
| Bom X Handle Grip | SGP | 250.00 |
| Bom X Monoshock | SGP | 7500.00 |
| Break Hose Front | SGP | 850.00 |
| Break Hose Rear | SGP | 650.00 |
| Carburetor Cleaner | SGP | 170.00 |
| Chain Guide Long Carb/FI | SGP | 450.00 |
| Chain Guide Short Carb/FI | SGP | 480.00 |
| Clutch Arm | SGP | 510.00 |
| Clutch Holder | SGP | 850.00 |
| Clutch Linning Carb/FI | SGP | 1660.00 |
| Clutch Plate | SGP | 125.00 |
| Clutch Release Bearing | SGP | 420.00 |
| Clutch Side Gasket Carb/FI | SGP | 220.00 |
| Clutch Spring set | SGP | 1000.00 |
| Connecting Rod Kit Carb/FI | SGP | 3250.00 |
| Coolant | SGP | 380.00 |
| Crankshaft Bearing Clutchside | SGP | 1100.00 |
| Crankshaft Bearing Magneto | SGP | 1100.00 |
| Domino Switch | SGP | 150.00 |
| Drain Plug Bolts | SGP | 150.00 |
| Dust Seal Front Shock | SGP | 160.00 |
| Exhaust Cams Carb/FI | SGP | 6970.00 |
| Exhaust Gasket | SGP | 30.00 |
| Faito Connecting Rod Kit with Bearing | SGP | 4250.00 |
| Fan Relay | SGP | 330.00 |
| Fork Oil | SGP | 290.00 |
| Front Shock Ring Stopper | SGP | 60.00 |
| Gasket Muffler | SGP | 250.00 |
| Handle Grip | SGP | 200.00 |
| High Tension Seal | SGP | 170.00 |
| Hydrolic Switch | SGP | 350.00 |
| Injector SGP | SGP | 1500.00 |
| Inner Tube | SGP | 3450.00 |
| Insulator Intake Pipe | SGP | 350.00 |
| Intake Cams Carb/FI | SGP | 3700.00 |
| Jettings | SGP | 150.00 |
| Koso Evo 30mm | SGP | 6250.00 |
| Koso Evo 32mm | SGP | 6450.00 |
| Kunya Magneto | SGP | 150.00 |
| LED Light | SGP | 750.00 |
| Lens Oil Inspection | SGP | 600.00 |
| Lever Break | SGP | 350.00 |
| Lever Clutch | SGP | 350.00 |
| Magento Gasket Carb/FI | SGP | 200.00 |
| Manifold | SGP | 950.00 |
| MDL Package - Basic | MDL | 1700.00 |
| MDL Package - Senlo M5 100W | Senlo | 5450.00 |
| MDL Package - Senlo T1/M1A 60W | Senlo | 3800.00 |
| O Ring Insulator | SGP | 200.00 |
| O Ring Neutral Sensor | SGP | 100.00 |
| O Ring Oil Filter Cap | SGP | 60.00 |
| O Ring Oil Filter Small | SGP | 40.00 |
| Oil 1L | SGP | 420.00 |
| Oil Cap | SGP | 220.00 |
| Oil Filter | SGP | 130.00 |
| Oil Filter Screen | SGP | 250.00 |
| Oil Pump Gear Carb/FI | SGP | 240.00 |
| Oil Seal Clutch | SGP | 150.00 |
| Oil Seal Driveshaft Carb/FI | SGP | 300.00 |
| Oil Seal Front Shock | SGP | 250.00 |
| Oil Seal Kambyo | SGP | 150.00 |
| Oil Seal Kick | SGP | 80.00 |
| Oil Seal Rear Shock | SGP | 650.00 |
| Oil Seal Small | SGP | 150.00 |
| Pin Dowel Block | SGP | 150.00 |
| Pin Dowel Block Head | SGP | 150.00 |
| Piston  Carb/FI | SGP | 910.00 |
| Piston Pin | SGP | 350.00 |
| Piston Ring Carb/FI | SGP | 970.00 |
| Pito sa Gulong | SGP | 100.00 |
| Pitsbike 34mm TB | SGP | 3400.00 |
| Pitsbike Crankshaft Bearing | SGP | 1800.00 |
| Pitsbike Oil Pump | SGP | 1700.00 |
| Pitsbike Racing ECU | SGP | 6500.00 |
| Pitsbike Tech 2 CDI | SGP | 5500.00 |
| Pitsbike TPS | SGP | 1700.00 |
| Quantum Battery | SGP | 1550.00 |
| Race Power Monoshock4800 | SGP | 5500.00 |
| Rack Release | SGP | 360.00 |
| RCB Front Caliper | SGP | 3300.00 |
| RCB Rear Caliper | SGP | 3600.00 |
| RCB/JRP Handle Grip | SGP | 200.00 |
| Return Spring | SGP | 180.00 |
| Rotor Disk Front | SGP | 2940.00 |
| Rotor Disk Rear | SGP | 2740.00 |
| Rubber Dumper | SGP | 390.00 |
| sgp oil strainer | SGP | 300.00 |
| Shim Cap | SGP | 450.00 |
| Shims | SGP | 250.00 |
| Side Mirror Reborn set | SGP | 1820.00 |
| Spacer Axle Front/Rear | SGP | 300.00 |
| Spacer Bearing  Mags | SGP | 170.00 |
| Spacer Mags Front | SGP | 180.00 |
| Spacer Mags Rear | SGP | 220.00 |
| Sparkplug Brisk Blue | SGP | 600.00 |
| Sparkplug Cap Assy | SGP | 650.00 |
| Sparkplug Gpower | SGP | 320.00 |
| Sparkplug Racing Red | SGP | 900.00 |
| Sprocket Hub | SGP | 820.00 |
| Sprocket Hub Spacer | SGP | 300.00 |
| Sprocket Set SSS Gold | SSS | 2400.00 |
| Sprocket Set SSS Silver | SSS | 2000.00 |
| Starter Motor | SGP | 2500.00 |
| Starter Relay | SGP | 860.00 |
| Stud Bolt | SGP | 80.00 |
| Tensionare Carb/FI | SGP | 1470.00 |
| Tensioner Gasket | SGP | 30.00 |
| Throttle Cable Shogun | SGP | 150.00 |
| Timming Chain Carb/FI | SGP | 1050.00 |
| Top Cover Bolt | SGP | 80.00 |
| Top Cover Gasket | SGP | 650.00 |
| UMA Quick Throttle | SGP | 1200.00 |
| Valve Lock | SGP | 170.00 |
| Valve Retainer | SGP | 170.00 |
| Valve Seal | SGP | 130.00 |
| Valve Spring | SGP | 200.00 |
| Vendix Drive Carb/FI | SGP | 4050.00 |
| Voltmeter | SGP | 250.00 |
| Washer Block | SGP | 250.00 |
| Washer Clutch Hub | SGP | 350.00 |
| Water Pump Oil Seal | SGP | 690.00 |
| Water Pump Shaft | SGP | 410.00 |
| Water Temperature Sensor | SGP | 2800.00 |
| Yolac Cams | SGP | 5000.00 |

## SERVICES (32 items)

| Name | Brand | Price |
|---|---|---|
| 180cc FI | - | 21200.00 |
| 180cc with 28mm Carb | - | 9450.00 |
| Basic Set (ECU/TB/Dyno Tune) | - | 15600.00 |
| Carb / Install | - | 2200.00 |
| Carb Cleaning | - | 450.00 |
| Chain adjust | - | 50.00 |
| Clearance/Shims | - | 1500.00 |
| Clutch Housing Repair | - | 350.00 |
| Clutch Side Labor (Carb) | - | 400.00 |
| Clutch Side Labor (FI) | - | 650.00 |
| Front Shock Tune | - | 1500.00 |
| Full Wave | - | 1500.00 |
| Head Repair | - | 350.00 |
| Magneto Side Labor | - | 400.00 |
| PCC SET | - | 13000.00 |
| PIAA Package | - | 1700.00 |
| PMS 1 | - | 1470.00 |
| PMS 2 | - | 2740.00 |
| PMS 3 | - | 5610.00 |
| PortHicom | - | 6000.00 |
| Rear Shock Tune | - | 1800.00 |
| Refresh (Carb) | - | 3050.00 |
| Refresh (FI) | - | 4500.00 |
| REMAP w/ Wide Band Nut | - | 3500.00 |
| Reset Tensionare | - | 250.00 |
| Rethread 6mm | - | 150.00 |
| Rethread 7mm | - | 200.00 |
| Rethread 8mm | - | 350.00 |
| Sprocket Set SSS Gold Installation | SSS | 350.00 |
| Sprocket Set SSS Silver Installation | SSS | 350.00 |
| Superstock | - | 17200.00 |
| TB cleaning | - | 450.00 |

