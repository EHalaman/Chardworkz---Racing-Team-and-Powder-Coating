-- Optional deliverer info alongside the existing supplier/receiver on a stock
-- receipt - who physically dropped it off isn't always the same as the
-- supplier company on file, and isn't tracked anywhere today. Nullable, same
-- walk-in-friendly optional-field pattern as sale.customer_name/_phone (V7/V8).
ALTER TABLE stock_in ADD COLUMN deliverer_name VARCHAR(150);
ALTER TABLE stock_in ADD COLUMN deliverer_contact VARCHAR(50);
