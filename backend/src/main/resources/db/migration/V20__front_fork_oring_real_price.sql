-- One more supersession match found on a closer re-check of the front fork
-- damper figure page (missed in V19's first pass): the only O-ring listed
-- on that whole figure is 51117-09G00-000 (".O-RING", 19), the same
-- shared 51117 base part number as this product's stale 2016 number
-- (51117-25G80-000), just a re-suffixed revision.
UPDATE product SET
    unit_price = 19.00,
    oem_part_no = '51117-09G00-000',
    updated_at = now()
WHERE id = 230;
