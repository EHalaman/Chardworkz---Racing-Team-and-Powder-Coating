-- Optional walk-in-friendly customer name for the printable receipt - nullable
-- since most counter sales at a small motor-parts shop have no formal
-- customer record and shouldn't be blocked by a required field.
ALTER TABLE sale ADD COLUMN customer_name VARCHAR(150);
