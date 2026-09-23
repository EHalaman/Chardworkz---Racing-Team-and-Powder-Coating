-- OEM manufacturer part number, distinct from the existing unused `sku`
-- column (reserved for a future internal barcode/SKU scheme, not the same
-- concept as a manufacturer's genuine-parts catalogue number). Nullable -
-- most existing products (generic test data, services) have no OEM part
-- number and never will.
ALTER TABLE product ADD COLUMN oem_part_no VARCHAR(30);
