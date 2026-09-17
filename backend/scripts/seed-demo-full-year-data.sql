-- ============================================================================
-- ChardWorkz — DEMO / LOCAL-ONLY full-year seed data
-- ============================================================================
-- NOT a Flyway migration. Deliberately kept outside db/migration/ so it can
-- NEVER run automatically against any environment, including real production
-- on Railway once deployed. Run it manually, by hand, against a local or
-- demo-only database:
--
--   psql -h localhost -U chardworkz -d chardworkz -f backend/scripts/seed-demo-full-year-data.sql
--
-- Context: an external "Lead DB Architect" proposal (2026-09-17) asked for
-- this as a real Flyway migration (which would have run in production too),
-- seeding ~500-1000 fabricated historical sales spanning Sept 2025-Sept 2026.
-- Confirmed with the business owner this is for local/demo (thesis-defense)
-- use only, never real production data — see DECISIONS.md DEC-055.
--
-- Deliberately does NOT: add an `is_service` boolean column (DEC-038 already
-- rejected this — services are `category = 'SERVICES'`, a second field
-- tracking the same thing risks drift), add a `customer` table (out of scope
-- this phase per V1's own comment — no storefront/customer entity exists),
-- or add a `unit_cost` column to `product` (cost lives per-receipt on
-- `stock_in_line`, matching the existing schema; this script generates real
-- historical stock_in/stock_in_line rows instead of inventing a new column).
--
-- Idempotency: the new product/supplier rows below are guarded with
-- NOT EXISTS checks, safe to re-run. The stock-receipt and sales generation
-- block at the bottom is NOT idempotent — every run adds another full year
-- of data on top of whatever's already there. Run it once against a
-- freshly-migrated (V1-V7) database, or accept the duplication.
--
-- Uses only accounts/branches/suppliers that already exist in this database
-- (queried dynamically, not hardcoded IDs) — this script does not create any
-- new login accounts, so it never needs to fabricate a bcrypt password hash.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. New Raider R150 FI parts + workshop services not already covered by
--    V4__seed_raider_parts.sql (NGK spark plug, Clutch Plate Set, Paper Air
--    Cleaner Element, Oil Filter Element, both Valve Springs, and the RK
--    428KLO Drive Chain already exist there — not duplicated here).
--    Prices are estimated placeholders, same disclaimer as V4: correct
--    against real supplier/retail pricing before relying on them for real
--    sales, if this data is ever promoted beyond local/demo use.
-- ---------------------------------------------------------------------------

INSERT INTO product (name, brand_tag, category, unit_price, is_active, created_at, updated_at)
SELECT * FROM (VALUES
    ('Cylinder Block Assembly', 'OEM', 'FI', 3200.00, true, now(), now()),
    ('Piston Ring Set', 'OEM', 'FI', 380.00, true, now(), now()),
    ('Piston Pin & Circlips', 'OEM', 'FI', 150.00, true, now(), now()),
    ('Cylinder Head Gasket', 'OEM', 'FI', 220.00, true, now(), now())
) AS v(name, brand_tag, category, unit_price, is_active, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.name = v.name);

INSERT INTO product (name, brand_tag, category, unit_price, is_active, created_at, updated_at)
SELECT * FROM (VALUES
    ('Full Engine Overhaul Labor', 'ChardWorkz', 'SERVICES', 3500.00, true, now(), now()),
    ('Cylinder Head Refacing', 'ChardWorkz', 'SERVICES', 900.00, true, now(), now())
) AS v(name, brand_tag, category, unit_price, is_active, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.name = v.name);

-- Starting stock for the new physical parts at both branches (SERVICES rows
-- deliberately get no stock_level row — matches DEC-038's stock-tracking
-- exclusion for services).
INSERT INTO stock_level (product_id, branch_id, quantity, reorder_threshold, updated_at)
SELECT p.id, b.id, seed.quantity, seed.reorder_threshold, now()
FROM (VALUES
    ('Cylinder Block Assembly', 3, 1),
    ('Piston Ring Set', 10, 3),
    ('Piston Pin & Circlips', 15, 5),
    ('Cylinder Head Gasket', 12, 4)
) AS seed(product_name, quantity, reorder_threshold)
JOIN product p ON p.name = seed.product_name
CROSS JOIN branch b
WHERE b.code IN ('MAIN', 'MASINAG')
  AND NOT EXISTS (
      SELECT 1 FROM stock_level sl WHERE sl.product_id = p.id AND sl.branch_id = b.id
  );

INSERT INTO supplier (name, contact_info, created_at)
SELECT 'Suzuki Genuine Parts - Central Distributor', 'demo data — no real contact', now()
WHERE NOT EXISTS (
    SELECT 1 FROM supplier s WHERE s.name = 'Suzuki Genuine Parts - Central Distributor'
);

-- ---------------------------------------------------------------------------
-- 2. Full-year historical data: monthly stock receipts + ~500-1000 sales
--    spread across 2025-09-01 to 2026-08-31 (365 days), across both
--    branches, using only accounts that already exist in this database.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    v_start_date     date := '2025-09-01';
    v_end_date       date := '2026-08-31';
    v_supplier_id    bigint;
    v_month_start    date;
    v_branch         record;
    v_receiver_id    bigint;
    v_stock_in_id    bigint;
    v_part           record;
    v_receive_qty    int;
    v_unit_cost      numeric(12,2);
    v_day            date;
    v_orders_today   int;
    v_order_idx      int;
    v_line_count     int;
    v_line_idx       int;
    v_cashier_id     bigint;
    v_sale_id        uuid;
    v_sold_at        timestamptz;
    v_subtotal       numeric(12,2);
    v_customer       text;
    v_payment_method text;
    v_payment_ref    text;
    v_line_product   record;
    v_line_qty       int;
    v_available      int;
    v_unit_price     numeric(12,2);
    v_line_total     numeric(12,2);
    v_customer_pool  text[] := ARRAY[
        'Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Bautista',
        'Ramon Villanueva', 'Liza Mercado', 'Carlo Aquino', 'Ninfa Torres'
    ];
    v_sales_created  int := 0;
BEGIN
    SELECT id INTO v_supplier_id FROM supplier
    WHERE name = 'Suzuki Genuine Parts - Central Distributor';

    -- 2a. Monthly stock receipts per branch, for every physical (non-SERVICES)
    -- product that already has a stock_level row there. Gives the year real
    -- receiving history instead of relying only on each product's one-time
    -- starting stock.
    v_month_start := v_start_date;
    WHILE v_month_start <= v_end_date LOOP
        FOR v_branch IN SELECT id, code FROM branch LOOP
            SELECT id INTO v_receiver_id FROM account
            WHERE branch_id = v_branch.id AND role IN ('MANAGER', 'OWNER') AND is_active
            ORDER BY random() LIMIT 1;

            IF v_receiver_id IS NOT NULL THEN
                INSERT INTO stock_in (supplier_id, branch_id, received_by, reference_no, received_at)
                VALUES (
                    v_supplier_id, v_branch.id, v_receiver_id,
                    'DEMO-' || to_char(v_month_start, 'YYYYMM') || '-' || v_branch.code,
                    v_month_start + time '09:00' + (random() * interval '3 hours')
                )
                RETURNING id INTO v_stock_in_id;

                FOR v_part IN
                    SELECT p.id, p.unit_price
                    FROM product p
                    JOIN stock_level sl ON sl.product_id = p.id AND sl.branch_id = v_branch.id
                    WHERE p.category <> 'SERVICES' AND p.deleted_at IS NULL
                LOOP
                    v_receive_qty := 5 + floor(random() * 15)::int;
                    v_unit_cost := round(v_part.unit_price * 0.65, 2);

                    INSERT INTO stock_in_line (stock_in_id, product_id, quantity, unit_cost)
                    VALUES (v_stock_in_id, v_part.id, v_receive_qty, v_unit_cost);

                    UPDATE stock_level
                    SET quantity = quantity + v_receive_qty, updated_at = now()
                    WHERE product_id = v_part.id AND branch_id = v_branch.id;
                END LOOP;
            END IF;
        END LOOP;

        v_month_start := v_month_start + interval '1 month';
    END LOOP;

    -- 2b. Daily sales. Weekends run busier than weekdays (light realism
    -- touch, not a rigorous seasonality model).
    v_day := v_start_date;
    WHILE v_day <= v_end_date LOOP
        IF extract(dow FROM v_day) IN (0, 6) THEN
            v_orders_today := 2 + floor(random() * 4)::int;   -- 2-5
        ELSE
            v_orders_today := floor(random() * 3)::int;       -- 0-2
        END IF;

        FOR v_order_idx IN 1..v_orders_today LOOP
            SELECT id, code INTO v_branch FROM branch ORDER BY random() LIMIT 1;

            -- Prefer an Employee for the counter; branches with no Employee
            -- account (e.g. MAIN in current dev data) fall back to
            -- Manager/Owner rather than failing the row.
            SELECT id INTO v_cashier_id FROM account
            WHERE branch_id = v_branch.id AND role = 'EMPLOYEE' AND is_active
            ORDER BY random() LIMIT 1;
            IF v_cashier_id IS NULL THEN
                SELECT id INTO v_cashier_id FROM account
                WHERE branch_id = v_branch.id AND is_active
                ORDER BY random() LIMIT 1;
            END IF;
            CONTINUE WHEN v_cashier_id IS NULL;

            v_sold_at := v_day + (time '08:00' + (random() * interval '11 hours'));
            v_sale_id := gen_random_uuid();

            IF random() < 0.55 THEN
                v_customer := NULL; -- walk-in, matches DEC-044's nullable default
            ELSE
                v_customer := v_customer_pool[1 + floor(random() * array_length(v_customer_pool, 1))::int];
            END IF;

            v_payment_method := (ARRAY['CASH', 'GCASH', 'EWALLET_OTHER'])[1 + floor(random() * 3)::int];
            IF v_payment_method = 'CASH' THEN
                v_payment_ref := NULL;
            ELSE
                v_payment_ref := upper(left(v_payment_method, 2)) || '-' || floor(random() * 900000 + 100000)::text;
            END IF;

            v_subtotal := 0;
            v_line_count := 1 + floor(random() * 4)::int; -- 1-4 lines

            INSERT INTO sale (id, branch_id, employee_id, payment_method, payment_reference,
                               customer_name, subtotal, total, sold_at, synced_at)
            VALUES (v_sale_id, v_branch.id, v_cashier_id, v_payment_method, v_payment_ref,
                    v_customer, 0, 0, v_sold_at, v_sold_at);

            FOR v_line_idx IN 1..v_line_count LOOP
                IF random() < 0.7 THEN
                    -- Physical product line — only from products that still
                    -- have stock at this branch.
                    SELECT p.id, p.unit_price, sl.quantity INTO v_line_product
                    FROM product p
                    JOIN stock_level sl ON sl.product_id = p.id AND sl.branch_id = v_branch.id
                    WHERE p.category <> 'SERVICES' AND p.deleted_at IS NULL AND p.is_active
                      AND sl.quantity > 0
                    ORDER BY random() LIMIT 1;
                ELSE
                    v_line_product := NULL;
                END IF;

                IF v_line_product IS NULL THEN
                    -- Service line (labor never tracks stock).
                    SELECT id, unit_price, NULL::int AS quantity INTO v_line_product
                    FROM product WHERE category = 'SERVICES' AND is_active
                    ORDER BY random() LIMIT 1;
                    v_line_qty := 1;
                ELSE
                    v_available := v_line_product.quantity;
                    v_line_qty := 1 + floor(random() * least(3, v_available))::int;
                    UPDATE stock_level SET quantity = quantity - v_line_qty, updated_at = now()
                    WHERE product_id = v_line_product.id AND branch_id = v_branch.id;
                END IF;

                CONTINUE WHEN v_line_product IS NULL;

                -- ~10% of lines get a custom price override (promo/negotiated
                -- discount) instead of the product's current list price —
                -- the edge case the proposal asked for; unit_price already
                -- lives per sale_line independently of product.unit_price.
                IF random() < 0.10 THEN
                    v_unit_price := round((v_line_product.unit_price * (0.85 + random() * 0.10))::numeric, 2);
                ELSE
                    v_unit_price := v_line_product.unit_price;
                END IF;

                v_line_total := round(v_unit_price * v_line_qty, 2);
                v_subtotal := v_subtotal + v_line_total;

                INSERT INTO sale_line (sale_id, product_id, quantity, unit_price, line_total)
                VALUES (v_sale_id, v_line_product.id, v_line_qty, v_unit_price, v_line_total);
            END LOOP;

            UPDATE sale SET subtotal = v_subtotal, total = v_subtotal WHERE id = v_sale_id;
            v_sales_created := v_sales_created + 1;
        END LOOP;

        v_day := v_day + 1;
    END LOOP;

    RAISE NOTICE 'Demo seed complete: % sales created across %..%', v_sales_created, v_start_date, v_end_date;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Explicit edge cases (left to chance above, they might not reliably
--    occur — forced here so the UI always has something to show):
--    zero-stock item, a below-reorder-threshold item, and a soft-deleted
--    (discontinued) product with real sales history behind it.
-- ---------------------------------------------------------------------------

UPDATE stock_level SET quantity = 0, updated_at = now()
WHERE product_id = (SELECT id FROM product WHERE name = 'RK 428KLO Drive Chain (116L)')
  AND branch_id = (SELECT id FROM branch WHERE code = 'MAIN');

UPDATE stock_level SET quantity = 1, updated_at = now()
WHERE product_id = (SELECT id FROM product WHERE name = 'Clutch Plate Set')
  AND branch_id = (SELECT id FROM branch WHERE code = 'MASINAG');

UPDATE product SET is_active = false, deleted_at = now(), updated_at = now()
WHERE name = 'Piston Ring Set';
