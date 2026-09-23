-- RAIDER_FI_SERVICES.md's materials lists confirm 2 real OEM part numbers
-- that couldn't be matched with confidence in the V15 session (its source
-- catalogue's Oil Pump/Air Cleaner figures extracted as run-on text):
--   Oil Filter Element            -> 16510-45H10-000 (SGP Oil Filter)
--   Paper Air Cleaner Element     -> 13780-12K00-000 (SGP Air Cleaner Filter Assembly)
--
-- The second one is the exact same OEM part V15 already added as a new,
-- separate product ("Air Cleaner Filter Assembly (Complete)") - an
-- accidental duplicate, not two different real parts. Per the user's
-- explicit choice, that duplicate is removed here (it was seeded the same
-- session with zero sales/receiving history - confirmed via psql before
-- writing this migration - so removing it destroys no real business data)
-- and 'Paper Air Cleaner Element' becomes the single row for this part.

UPDATE product SET oem_part_no = '16510-45H10-000', updated_at = now()
WHERE name = 'Oil Filter Element';

UPDATE product SET oem_part_no = '13780-12K00-000', updated_at = now()
WHERE name = 'Paper Air Cleaner Element';

DELETE FROM stock_level
WHERE product_id = (SELECT id FROM product WHERE name = 'Air Cleaner Filter Assembly (Complete)');

DELETE FROM product WHERE name = 'Air Cleaner Filter Assembly (Complete)';
