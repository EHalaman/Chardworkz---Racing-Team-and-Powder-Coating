-- Snapshots the package name onto each sale_line at sale time, same pattern
-- as unit_price/unit_cost, so editing/renaming a service_package later never
-- retroactively changes what a past receipt or Sales Audit Breakdown shows.
-- Previously packageName was resolved via a live join to service_package,
-- which this column replaces as the read path going forward.
ALTER TABLE sale_line ADD COLUMN package_name VARCHAR(150);

-- Best-effort backfill for existing rows using each package's current name -
-- not retroactively perfect for a package already renamed before this
-- migration ran, but strictly better than leaving historical rows NULL.
UPDATE sale_line sl
SET package_name = sp.name
FROM service_package sp
WHERE sl.package_id = sp.id
  AND sl.package_name IS NULL;
