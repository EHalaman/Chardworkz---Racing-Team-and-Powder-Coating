-- Adds product categorization (CARB/FI/OTHERS/SERVICES) and a per-branch
-- monthly sales goal, both needed for the real Dashboard (replacing its
-- mock data) and the Suzuki Raider R150 FI parts seed (V4).
--
-- category uses VARCHAR + CHECK, not a native Postgres ENUM type, matching
-- the existing convention for `role` and `payment_method` in V1 - a native
-- enum makes `ALTER TYPE ... ADD VALUE` awkward inside a transaction if a
-- category is ever added later.

ALTER TABLE product
    ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'OTHERS'
        CHECK (category IN ('CARB', 'FI', 'OTHERS', 'SERVICES'));

ALTER TABLE branch
    ADD COLUMN monthly_sales_goal NUMERIC(12, 2) NOT NULL DEFAULT 0.00;
