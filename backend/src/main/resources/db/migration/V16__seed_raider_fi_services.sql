-- Real service menu sourced from RELATED DOCUMENTS/RAIDER_FI_SERVICES.md
-- (the "Suzuki Raider R150 FI Master Workshop Service Menu" spec doc) - 20
-- services across PMS, brake/suspension, engine/transmission overhaul, and
-- FI/electrical. Each service in that document is a labor charge; the real
-- OEM parts it consumes are sold separately as their own `product` rows
-- (most already exist from V4/V15) - this app has no service-to-parts
-- recipe/BOM system, so pricing here is labor only, same convention the
-- existing services (CHANGE OIL SERVICE, PMS, etc.) already use.
--
-- unit_price values are AI-ESTIMATED PLACEHOLDERS calibrated against this
-- shop's own existing real service prices (CHANGE OIL SERVICE ~180,
-- PMS 350, Cylinder Head Refacing 900, Full Engine Overhaul Labor 3500) -
-- same caveat as every other placeholder price this project has seeded.
-- Correct via the Products screen before relying on them for a real sale.
--
-- 3 of the 20 services overlap with services already in the catalog under
-- simpler names - per the user's explicit choice, those 3 are renamed/
-- repriced in place rather than added as separate new rows, so the catalog
-- doesn't end up with two near-duplicate "oil change" style options.
-- SERVICES are excluded from stock_level entirely (DEC-038's
-- findByActiveTrueAndCategoryNot(SERVICES) convention - "always available",
-- no inventory to track), so no stock_level rows are seeded here.

-- 1. Replace the 3 overlapping existing services in place.
UPDATE product SET
    name = 'Engine Oil & Filter Service',
    brand_tag = 'SGP',
    unit_price = 150.00,
    updated_at = now()
WHERE name = 'CHANGE OIL SERVICE';

UPDATE product SET
    name = 'Throttle Body Service & Ultrasonic Injector Cleaning',
    brand_tag = 'SGP',
    unit_price = 400.00,
    updated_at = now()
WHERE name = 'Fi Cleaning Service';

UPDATE product SET
    name = 'Fuel Pump Filter Replacement',
    brand_tag = 'SGP',
    unit_price = 180.00,
    updated_at = now()
WHERE name = 'Change Fuel Filter';

-- 2. Add the other 17 services as new products.
INSERT INTO product (name, brand_tag, category, unit_price, is_active, created_at, updated_at) VALUES
    ('Spark Plug Replacement', 'SGP', 'SERVICES', 80.00, true, now(), now()),
    ('Air Cleaner Element Service', 'SGP', 'SERVICES', 80.00, true, now(), now()),
    ('Drive Chain & Sprocket Replacement', 'SGP', 'SERVICES', 250.00, true, now(), now()),
    ('Radiator Coolant Flush & Refill', 'SGP', 'SERVICES', 200.00, true, now(), now()),
    ('Front Brake Caliper & Fluid Service', 'SGP', 'SERVICES', 250.00, true, now(), now()),
    ('Rear Brake Master Cylinder Overhaul', 'SGP', 'SERVICES', 300.00, true, now(), now()),
    ('Front Fork Re-fluid & Seal Overhaul', 'SGP', 'SERVICES', 600.00, true, now(), now()),
    ('Steering Head Stem Bearing (Ball Race) Replacement', 'SGP', 'SERVICES', 500.00, true, now(), now()),
    ('Rear Swingarm & Wheel Hub Bushing Service', 'SGP', 'SERVICES', 400.00, true, now(), now()),
    ('Cylinder Head Top-Overhaul & Carbon Cleaning', 'SGP', 'SERVICES', 1200.00, true, now(), now()),
    ('Cylinder & Piston Kit Replacement', 'SGP', 'SERVICES', 1000.00, true, now(), now()),
    ('Clutch System Renewal', 'SGP', 'SERVICES', 500.00, true, now(), now()),
    ('Cam Chain & Tensioner Replacement', 'SGP', 'SERVICES', 450.00, true, now(), now()),
    ('Full Crankcase Engine Bottom-End Overhaul', 'SGP', 'SERVICES', 4000.00, true, now(), now()),
    ('Water Pump Seal & Shaft Rebuild', 'SGP', 'SERVICES', 450.00, true, now(), now()),
    ('Starter Motor Carbon Brush Overhaul', 'SGP', 'SERVICES', 300.00, true, now(), now()),
    ('Charging System & Magneto Stator Service', 'SGP', 'SERVICES', 350.00, true, now(), now());
