-- Optional customer phone/email alongside V7's customer_name - same
-- walk-in-friendly, denormalized-per-sale pattern (no `customer` table
-- exists, deliberately out of scope per V1's own comment).
ALTER TABLE sale ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE sale ADD COLUMN customer_email VARCHAR(100);
