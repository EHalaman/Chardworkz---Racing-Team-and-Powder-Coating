-- Backfills real OEM part numbers (from the newly-reviewed
-- RELATED DOCUMENTS/Suzuki-Raider-150-FI Engines and body parts.pdf - the
-- full 81-page genuine-parts catalogue, distinct from the smaller owner's
-- manual V4 was sourced from) onto the 17 products V4 already seeded, and
-- adds 98 new products for real, individually-identifiable parts found in
-- that catalogue that weren't already covered.
--
-- unit_price values below are AI-ESTIMATED PLACEHOLDERS, same convention and
-- same caveat as V4 - the catalogue is parts-identity only, it does not list
-- retail prices. Correct them via the Products screen against real
-- supplier/retail pricing before relying on them for any real sale. See
-- ChardWorkz_Raider150FI_EnginesBodyParts_Summary.md and DECISIONS.md for
-- the full extraction/curation notes.
--
-- Not backfilled (no confident match found in the catalogue's cleanly-
-- parsed sections - the Battery, Oil Pump, and Clutch figures came out of
-- text extraction as a single run-on line that couldn't be reliably split
-- into per-part rows; would need a manual pass against the PDF itself):
-- '12V 18.0 kC (5.0 Ah) Battery', 'Fuse 10A (Sub)', 'Fuse 10A (Fan)',
-- 'Rear Disc Brake Pad Set', 'Paper Air Cleaner Element',
-- 'Oil Filter Element', 'Clutch Plate Set'.

-- 1. Backfill real OEM part numbers onto the 17 products V4 already seeded.
UPDATE product SET oem_part_no = '09482-00646-000' WHERE name = 'NGK MR8E-9 Spark Plug';
UPDATE product SET oem_part_no = '09481-20102-000' WHERE name = 'Fuse 20A (Main)';
UPDATE product SET oem_part_no = '59100-34880-000' WHERE name = 'Front Disc Brake Pad Set';
UPDATE product SET oem_part_no = '59480-12K00-000' WHERE name = 'Front Brake Hose';
UPDATE product SET oem_part_no = '69480-12K00-000' WHERE name = 'Rear Brake Hose';
UPDATE product SET oem_part_no = '27610-12K00-116' WHERE name = 'RK 428KLO Drive Chain (116L)';
UPDATE product SET oem_part_no = '58300-12K00-000' WHERE name = 'Throttle Cable';
UPDATE product SET oem_part_no = '58200-12K00-000' WHERE name = 'Clutch Cable';
-- The catalogue lists a single "SPRING, VALVE" part number - this engine's
-- intake and exhaust valve springs are the same physical part, not two
-- distinct ones, so both existing products correctly map to the same number.
UPDATE product SET oem_part_no = '12921-12K00-000' WHERE name = 'Valve Spring - Intake';
UPDATE product SET oem_part_no = '12921-12K00-000' WHERE name = 'Valve Spring - Exhaust';

-- 2. New products - real, individually-identifiable OEM parts from the
-- catalogue not already covered above. Generic descriptions (bearing,
-- O-ring, seal) are disambiguated in the name by the assembly they belong
-- to and/or the OEM part number, since the catalogue itself gives them no
-- distinguishing size/spec text.
INSERT INTO product (name, brand_tag, category, oem_part_no, unit_price, is_active, created_at, updated_at) VALUES
    ('Cylinder Head Cover Gasket No.1', 'OEM', 'FI', '11173-12K00-000', 80.00, true, now(), now()),
    ('Cylinder Head Cover Gasket No.2', 'OEM', 'FI', '11178-12K00-000', 80.00, true, now(), now()),
    ('Cylinder Head Gasket (Genuine OEM)', 'OEM', 'FI', '11141-12K00-000', 150.00, true, now(), now()),
    ('O-Ring - Cylinder Head', 'OEM', 'FI', '09280-35009-000', 30.00, true, now(), now()),
    ('O-Ring 3.1x16.8mm - Crankcase Cover', 'OEM', 'FI', '09280-17003-000', 30.00, true, now(), now()),
    ('O-Ring 3.1x32.7mm - Crankcase Cover', 'OEM', 'FI', '09280-33004-000', 30.00, true, now(), now()),
    ('O-Ring 2.4x13.8mm - Crankcase Cover', 'OEM', 'FI', '09280-14003-000', 30.00, true, now(), now()),
    ('Engine Sprocket Cover', 'OEM', 'FI', '11360-12K00-000', 250.00, true, now(), now()),
    ('Crankshaft Bearing (28058)', 'OEM', 'FI', '09262-28058-000', 180.00, true, now(), now()),
    ('Crankshaft Bearing (35103)', 'OEM', 'FI', '09262-35103-000', 180.00, true, now(), now()),
    ('Crankshaft Oil Seal 12x21x7mm', 'OEM', 'FI', '09282-12L01-000', 60.00, true, now(), now()),
    ('Starter Clutch Bearing', 'OEM', 'FI', '09263-22075-000', 180.00, true, now(), now()),
    ('Crank Balancer Bearing (15054)', 'OEM', 'FI', '09262-15054-000', 150.00, true, now(), now()),
    ('Crank Balancer Bearing (15055)', 'OEM', 'FI', '09262-15055-000', 150.00, true, now(), now()),
    ('Camshaft Sprocket (34T)', 'OEM', 'FI', '12741-12K00-000', 350.00, true, now(), now()),
    ('Valve Spring Retainer', 'OEM', 'FI', '12931-25G10-000', 40.00, true, now(), now()),
    ('Valve Spring Seat', 'OEM', 'FI', '12933-12K00-000', 40.00, true, now(), now()),
    ('Valve Stem Oil Seal 4.5x10x8mm', 'OEM', 'FI', '09289-04002-000', 50.00, true, now(), now()),
    ('Cam Chain', 'OEM', 'FI', '12760-12K00-000', 450.00, true, now(), now()),
    ('Cam Chain Guide No.1', 'OEM', 'FI', '12771-12K00-000', 180.00, true, now(), now()),
    ('Cam Chain Guide No.2', 'OEM', 'FI', '12782-12K00-000', 180.00, true, now(), now()),
    ('Cam Chain Tensioner', 'OEM', 'FI', '12811-12K00-000', 280.00, true, now(), now()),
    ('Cam Chain Tensioner Bolt', 'OEM', 'FI', '12812-35C00-000', 40.00, true, now(), now()),
    ('O-Ring - Throttle Body', 'OEM', 'FI', '13453-36F00-000', 30.00, true, now(), now()),
    ('O-Ring - Throttle Body (Injector)', 'OEM', 'FI', '15716-42J00-000', 30.00, true, now(), now()),
    ('Air Cleaner Filter Assembly (Complete)', 'OEM', 'FI', '13780-12K00-000', 450.00, true, now(), now()),
    ('Air Cleaner Drain Plug', 'OEM', 'FI', '13878-12K00-000', 20.00, true, now(), now()),
    ('Fuel Pump Strainer/Filter', 'OEM', 'FI', '15420-12K00-000', 120.00, true, now(), now()),
    ('O-Ring - Fuel Pump', 'OEM', 'FI', '15424-09JB0-000', 30.00, true, now(), now()),
    ('O-Ring, Fuel Pump (Mounting)', 'OEM', 'FI', '15201-12K00-000', 30.00, true, now(), now()),
    ('O-Ring - Water Pump Case', 'OEM', 'FI', '17431-12K00-000', 30.00, true, now(), now()),
    ('Water Pump Shaft Oil Seal', 'OEM', 'FI', '17461-12K00-000', 60.00, true, now(), now()),
    ('Water Pump Bearing', 'OEM', 'FI', '08113-06080-000', 150.00, true, now(), now()),
    ('Transmission Bearing (62040)', 'OEM', 'FI', '08110-62040-000', 180.00, true, now(), now()),
    ('Transmission Bearing (60020)', 'OEM', 'FI', '08120-60020-000', 180.00, true, now(), now()),
    ('Drive Shaft Oil Seal', 'OEM', 'FI', '24399-12K00-000', 60.00, true, now(), now()),
    ('Transmission Bearing (62020)', 'OEM', 'FI', '08110-62020-000', 180.00, true, now(), now()),
    ('Transmission Bearing (62040-B)', 'OEM', 'FI', '08120-62040-000', 180.00, true, now(), now()),
    ('Countershaft Bearing Retainer', 'OEM', 'FI', '24741-20A10-000', 60.00, true, now(), now()),
    ('Engine (Front) Sprocket (14T)', 'OEM', 'FI', '27511-25G10-000', 250.00, true, now(), now()),
    ('Engine Sprocket Lock Plate', 'OEM', 'FI', '27512-25G00-000', 60.00, true, now(), now()),
    ('Transmission Bearing (60027)', 'OEM', 'FI', '08120-60027-000', 180.00, true, now(), now()),
    ('Gear Shift Shaft Bearing', 'OEM', 'FI', '08110-69050-000', 150.00, true, now(), now()),
    ('Gear Shift Shaft Oil Seal 14x22x6mm', 'OEM', 'FI', '09283-14014-000', 50.00, true, now(), now()),
    ('O-Ring - Gear Shifting', 'OEM', 'FI', '37722-25G00-000', 30.00, true, now(), now()),
    ('Kick Starter Oil Seal 16x24x5mm', 'OEM', 'FI', '09283-16008-000', 50.00, true, now(), now()),
    ('O-Ring - Starting Motor', 'OEM', 'FI', '31156-12K00-000', 30.00, true, now(), now()),
    ('O-Ring - Starter Motor Cover', 'OEM', 'FI', '31264-05530-000', 30.00, true, now(), now()),
    ('O-Ring - Starter Motor Housing', 'OEM', 'FI', '09280-12K00-000', 30.00, true, now(), now()),
    ('Magneto Lead Clamp (A)', 'OEM', 'FI', '32371-12K00-000', 25.00, true, now(), now()),
    ('Magneto Lead Clamp (B)', 'OEM', 'FI', '32371-16H00-000', 25.00, true, now(), now()),
    ('Spark Plug Cap', 'OEM', 'FI', '33510-25G00-000', 90.00, true, now(), now()),
    ('Spark Plug Seal', 'OEM', 'FI', '33541-25G00-000', 30.00, true, now(), now()),
    ('High Tension Cord Seal', 'OEM', 'FI', '33542-25G10-000', 30.00, true, now(), now()),
    ('Headlamp Bulb 12V 10W', 'OEM', 'FI', '09471-12203-000', 60.00, true, now(), now()),
    ('Tail/Brake Light Bulb 12V 18/5W', 'OEM', 'FI', '09471-12119-000', 60.00, true, now(), now()),
    ('Turn Signal Bulb 12V 5W', 'OEM', 'FI', '09471-12216-000', 40.00, true, now(), now()),
    ('Battery Cushion Rubber', 'OEM', 'FI', '92274-12K00-000', 40.00, true, now(), now()),
    ('Front Footrest Assembly RH', 'OEM', 'FI', '43501-12K10-000', 280.00, true, now(), now()),
    ('Front Footrest Bracket RH', 'OEM', 'FI', '43510-12K10-000', 180.00, true, now(), now()),
    ('Front Footrest Bar RH', 'OEM', 'FI', '43516-35F10-000', 150.00, true, now(), now()),
    ('Front Footrest Assembly LH', 'OEM', 'FI', '43502-12K10-000', 280.00, true, now(), now()),
    ('Front Footrest Bracket LH', 'OEM', 'FI', '43520-12K10-000', 180.00, true, now(), now()),
    ('Front Footrest Bar LH', 'OEM', 'FI', '43526-35F10-000', 150.00, true, now(), now()),
    ('Footrest Guard RH', 'OEM', 'FI', '43586-12K00-000', 120.00, true, now(), now()),
    ('Footrest Guard LH', 'OEM', 'FI', '43596-12K00-000', 120.00, true, now(), now()),
    ('Rear View Mirror RH', 'OEM', 'FI', '56500-34J50-000', 250.00, true, now(), now()),
    ('Rear View Mirror LH', 'OEM', 'FI', '56600-34J50-000', 250.00, true, now(), now()),
    ('Clutch Cable Guide', 'OEM', 'FI', '58620-12K00-000', 50.00, true, now(), now()),
    ('Clutch Cable Stopper', 'OEM', 'FI', '58634-12K00-000', 40.00, true, now(), now()),
    ('Throttle Grip', 'OEM', 'FI', '57110-12K00-000', 120.00, true, now(), now()),
    ('Front Brake Lever', 'OEM', 'FI', '57421-30H10-000', 180.00, true, now(), now()),
    ('Handlebar Grip LH', 'OEM', 'FI', '57211-40J00-000', 90.00, true, now(), now()),
    ('Clutch Lever', 'OEM', 'FI', '57621-23FA0-000', 180.00, true, now(), now()),
    ('Front Fork Dust Seal', 'OEM', 'FI', '51571-09G00-000', 90.00, true, now(), now()),
    ('O-Ring - Front Fork', 'OEM', 'FI', '51117-25G80-000', 30.00, true, now(), now()),
    ('Steering Stem Upper Dust Seal', 'OEM', 'FI', '51643-06001-000', 60.00, true, now(), now()),
    ('Front Wheel Bearing', 'OEM', 'FI', '08113-63017-000', 180.00, true, now(), now()),
    ('Front Wheel Oil Seal 25x40x6mm', 'OEM', 'FI', '09285-25003-000', 60.00, true, now(), now()),
    ('Front Brake Disc', 'OEM', 'FI', '59211-25G60-000', 1200.00, true, now(), now()),
    ('Front Tire', 'OEM', 'FI', '55110-12K00-000', 1800.00, true, now(), now()),
    ('Front Caliper Piston Seal Set', 'OEM', 'FI', '59300-30810-000', 250.00, true, now(), now()),
    ('Front Brake Hose Lower Clamp', 'OEM', 'FI', '59268-19D60-000', 30.00, true, now(), now()),
    ('Swingarm Chain Buffer', 'OEM', 'FI', '61273-25G10-000', 150.00, true, now(), now()),
    ('Chain Case Cover', 'OEM', 'FI', '61311-12K00-000', 200.00, true, now(), now()),
    ('Rear Brake Disc', 'OEM', 'FI', '69211-25G50-000', 1100.00, true, now(), now()),
    ('Rear Wheel Bearing (Inner)', 'OEM', 'FI', '08143-62017-000', 180.00, true, now(), now()),
    ('Rear Sprocket Drum Retainer', 'OEM', 'FI', '64733-12K00-000', 80.00, true, now(), now()),
    ('Rear Sprocket Drum', 'OEM', 'FI', '64611-12K00-000', 650.00, true, now(), now()),
    ('Rear Wheel Bearing (Outer)', 'OEM', 'FI', '08113-62037-000', 180.00, true, now(), now()),
    ('Rear Sprocket Drum Spacer', 'OEM', 'FI', '64741-25G00-000', 50.00, true, now(), now()),
    ('Rear Sprocket (38T)', 'OEM', 'FI', '64511-12K00-000', 450.00, true, now(), now()),
    ('Chain Adjuster', 'OEM', 'FI', '61410-28F00-000', 90.00, true, now(), now()),
    ('Chain Adjuster Guide Plate', 'OEM', 'FI', '61421-05F00-000', 60.00, true, now(), now()),
    ('Rear Tire', 'OEM', 'FI', '65110-12K00-000', 2000.00, true, now(), now()),
    ('Rear Caliper Piston Seal Set', 'OEM', 'FI', '69300-12810-000', 250.00, true, now(), now()),
    ('O-Ring - Rear Master Cylinder', 'OEM', 'FI', '69686-12K00-000', 30.00, true, now(), now()),
    ('Rear Brake Hose Clamp', 'OEM', 'FI', '69734-12K00-000', 30.00, true, now(), now());

-- 3. Modest starting stock at both branches, same convention as V4 - cheap
-- small parts get a higher quantity/reorder threshold, expensive or bulky
-- ones (tires, discs, the sprocket drum) get a lower one.
INSERT INTO stock_level (product_id, branch_id, quantity, reorder_threshold, updated_at)
SELECT p.id, b.id, seed.quantity, seed.reorder_threshold, now()
FROM (VALUES
    ('Cylinder Head Cover Gasket No.1', 6, 2),
    ('Cylinder Head Cover Gasket No.2', 6, 2),
    ('Cylinder Head Gasket (Genuine OEM)', 4, 2),
    ('O-Ring - Cylinder Head', 10, 3),
    ('O-Ring 3.1x16.8mm - Crankcase Cover', 10, 3),
    ('O-Ring 3.1x32.7mm - Crankcase Cover', 10, 3),
    ('O-Ring 2.4x13.8mm - Crankcase Cover', 10, 3),
    ('Engine Sprocket Cover', 3, 1),
    ('Crankshaft Bearing (28058)', 4, 2),
    ('Crankshaft Bearing (35103)', 4, 2),
    ('Crankshaft Oil Seal 12x21x7mm', 6, 2),
    ('Starter Clutch Bearing', 4, 2),
    ('Crank Balancer Bearing (15054)', 4, 2),
    ('Crank Balancer Bearing (15055)', 4, 2),
    ('Camshaft Sprocket (34T)', 3, 1),
    ('Valve Spring Retainer', 8, 3),
    ('Valve Spring Seat', 8, 3),
    ('Valve Stem Oil Seal 4.5x10x8mm', 8, 3),
    ('Cam Chain', 4, 2),
    ('Cam Chain Guide No.1', 4, 2),
    ('Cam Chain Guide No.2', 4, 2),
    ('Cam Chain Tensioner', 3, 1),
    ('Cam Chain Tensioner Bolt', 10, 3),
    ('O-Ring - Throttle Body', 10, 3),
    ('O-Ring - Throttle Body (Injector)', 10, 3),
    ('Air Cleaner Filter Assembly (Complete)', 4, 2),
    ('Air Cleaner Drain Plug', 10, 3),
    ('Fuel Pump Strainer/Filter', 5, 2),
    ('O-Ring - Fuel Pump', 10, 3),
    ('O-Ring, Fuel Pump (Mounting)', 10, 3),
    ('O-Ring - Water Pump Case', 10, 3),
    ('Water Pump Shaft Oil Seal', 6, 2),
    ('Water Pump Bearing', 4, 2),
    ('Transmission Bearing (62040)', 4, 2),
    ('Transmission Bearing (60020)', 4, 2),
    ('Drive Shaft Oil Seal', 6, 2),
    ('Transmission Bearing (62020)', 4, 2),
    ('Transmission Bearing (62040-B)', 4, 2),
    ('Countershaft Bearing Retainer', 6, 2),
    ('Engine (Front) Sprocket (14T)', 4, 2),
    ('Engine Sprocket Lock Plate', 6, 2),
    ('Transmission Bearing (60027)', 4, 2),
    ('Gear Shift Shaft Bearing', 4, 2),
    ('Gear Shift Shaft Oil Seal 14x22x6mm', 6, 2),
    ('O-Ring - Gear Shifting', 10, 3),
    ('Kick Starter Oil Seal 16x24x5mm', 6, 2),
    ('O-Ring - Starting Motor', 10, 3),
    ('O-Ring - Starter Motor Cover', 10, 3),
    ('O-Ring - Starter Motor Housing', 10, 3),
    ('Magneto Lead Clamp (A)', 10, 3),
    ('Magneto Lead Clamp (B)', 10, 3),
    ('Spark Plug Cap', 6, 2),
    ('Spark Plug Seal', 8, 3),
    ('High Tension Cord Seal', 8, 3),
    ('Headlamp Bulb 12V 10W', 10, 4),
    ('Tail/Brake Light Bulb 12V 18/5W', 10, 4),
    ('Turn Signal Bulb 12V 5W', 10, 4),
    ('Battery Cushion Rubber', 8, 3),
    ('Front Footrest Assembly RH', 3, 1),
    ('Front Footrest Bracket RH', 3, 1),
    ('Front Footrest Bar RH', 3, 1),
    ('Front Footrest Assembly LH', 3, 1),
    ('Front Footrest Bracket LH', 3, 1),
    ('Front Footrest Bar LH', 3, 1),
    ('Footrest Guard RH', 4, 2),
    ('Footrest Guard LH', 4, 2),
    ('Rear View Mirror RH', 5, 2),
    ('Rear View Mirror LH', 5, 2),
    ('Clutch Cable Guide', 6, 2),
    ('Clutch Cable Stopper', 6, 2),
    ('Throttle Grip', 5, 2),
    ('Front Brake Lever', 4, 2),
    ('Handlebar Grip LH', 5, 2),
    ('Clutch Lever', 4, 2),
    ('Front Fork Dust Seal', 6, 2),
    ('O-Ring - Front Fork', 10, 3),
    ('Steering Stem Upper Dust Seal', 4, 2),
    ('Front Wheel Bearing', 4, 2),
    ('Front Wheel Oil Seal 25x40x6mm', 6, 2),
    ('Front Brake Disc', 2, 1),
    ('Front Tire', 4, 2),
    ('Front Caliper Piston Seal Set', 4, 2),
    ('Front Brake Hose Lower Clamp', 8, 3),
    ('Swingarm Chain Buffer', 5, 2),
    ('Chain Case Cover', 3, 1),
    ('Rear Brake Disc', 2, 1),
    ('Rear Wheel Bearing (Inner)', 4, 2),
    ('Rear Sprocket Drum Retainer', 4, 2),
    ('Rear Sprocket Drum', 2, 1),
    ('Rear Wheel Bearing (Outer)', 4, 2),
    ('Rear Sprocket Drum Spacer', 4, 2),
    ('Rear Sprocket (38T)', 3, 1),
    ('Chain Adjuster', 5, 2),
    ('Chain Adjuster Guide Plate', 5, 2),
    ('Rear Tire', 4, 2),
    ('Rear Caliper Piston Seal Set', 4, 2),
    ('O-Ring - Rear Master Cylinder', 10, 3),
    ('Rear Brake Hose Clamp', 8, 3)
) AS seed(product_name, quantity, reorder_threshold)
JOIN product p ON p.name = seed.product_name
CROSS JOIN branch b
WHERE b.code IN ('MAIN', 'MASINAG');
