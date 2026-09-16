-- Suzuki Raider R150 FI OEM parts catalog, added alongside the existing
-- generic 'test' products (not replacing them - deleting live-tested data
-- in a migration is a separate, explicit decision, not bundled here).
-- Sourced from RELATED DOCUMENTS/770452473-Raider-150-Fi.pdf (the owner's
-- manual) for part identity only - the manual does not list retail prices.
--
-- unit_price values below are ESTIMATED PLACEHOLDERS, accepted by the
-- business owner on 2026-09-16 on the explicit condition that they will be
-- corrected against real supplier/retail pricing before being relied on for
-- any real sale - see DECISIONS.md. Do not treat these as real prices.
--
-- All parts are categorized 'FI' - the manual is specifically for the
-- fuel-injected Raider variant, not the carbureted one ('CARB' stays
-- available for a carbureted model's parts if ever added).

INSERT INTO product (name, brand_tag, category, unit_price, is_active, created_at, updated_at) VALUES
    ('NGK MR8E-9 Spark Plug', 'NGK', 'FI', 180.00, true, now(), now()),
    ('12V 18.0 kC (5.0 Ah) Battery', 'GS/Yuasa', 'FI', 1450.00, true, now(), now()),
    ('Fuse 20A (Main)', 'OEM', 'FI', 35.00, true, now(), now()),
    ('Fuse 10A (Sub)', 'OEM', 'FI', 35.00, true, now(), now()),
    ('Fuse 10A (Fan)', 'OEM', 'FI', 35.00, true, now(), now()),
    ('Front Disc Brake Pad Set', 'OEM', 'FI', 420.00, true, now(), now()),
    ('Rear Disc Brake Pad Set', 'OEM', 'FI', 420.00, true, now(), now()),
    ('Front Brake Hose', 'OEM', 'FI', 350.00, true, now(), now()),
    ('Rear Brake Hose', 'OEM', 'FI', 350.00, true, now(), now()),
    ('RK 428KLO Drive Chain (116L)', 'RK', 'FI', 1650.00, true, now(), now()),
    ('Paper Air Cleaner Element', 'OEM', 'FI', 280.00, true, now(), now()),
    ('Oil Filter Element', 'OEM', 'FI', 150.00, true, now(), now()),
    ('Clutch Plate Set', 'OEM', 'FI', 950.00, true, now(), now()),
    ('Valve Spring - Intake', 'OEM', 'FI', 220.00, true, now(), now()),
    ('Valve Spring - Exhaust', 'OEM', 'FI', 220.00, true, now(), now()),
    ('Throttle Cable', 'OEM', 'FI', 260.00, true, now(), now()),
    ('Clutch Cable', 'OEM', 'FI', 260.00, true, now(), now());

-- Modest starting stock at both branches so Dashboard/Inventory have real
-- non-zero data immediately, rather than every seeded product sitting at
-- 0/0 until someone manually receives stock through the UI.
INSERT INTO stock_level (product_id, branch_id, quantity, reorder_threshold, updated_at)
SELECT p.id, b.id, seed.quantity, seed.reorder_threshold, now()
FROM (VALUES
    ('NGK MR8E-9 Spark Plug', 20, 5),
    ('12V 18.0 kC (5.0 Ah) Battery', 6, 2),
    ('Fuse 20A (Main)', 30, 10),
    ('Fuse 10A (Sub)', 30, 10),
    ('Fuse 10A (Fan)', 30, 10),
    ('Front Disc Brake Pad Set', 12, 4),
    ('Rear Disc Brake Pad Set', 12, 4),
    ('Front Brake Hose', 8, 3),
    ('Rear Brake Hose', 8, 3),
    ('RK 428KLO Drive Chain (116L)', 5, 2),
    ('Paper Air Cleaner Element', 15, 5),
    ('Oil Filter Element', 25, 8),
    ('Clutch Plate Set', 6, 2),
    ('Valve Spring - Intake', 10, 4),
    ('Valve Spring - Exhaust', 10, 4),
    ('Throttle Cable', 8, 3),
    ('Clutch Cable', 8, 3)
) AS seed(product_name, quantity, reorder_threshold)
JOIN product p ON p.name = seed.product_name
CROSS JOIN branch b
WHERE b.code IN ('MAIN', 'MASINAG');
