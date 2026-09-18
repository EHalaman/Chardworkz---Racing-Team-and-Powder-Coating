-- Snapshots each sale_line's product cost at the moment of sale (from
-- ProductCostService's "most recently known receipt cost" approximation),
-- so future sales' COGS/margin stays accurate to what the item actually
-- cost when it was sold, instead of drifting whenever a later stock-in
-- receipt changes the price. Nullable: existing rows have no such snapshot
-- (backfilling one is not possible - no historical cost was ever recorded
-- at the time of those past sales), and SERVICES-category lines never get
-- one at all (no wage/technician cost is tracked anywhere in this schema).
ALTER TABLE sale_line ADD COLUMN unit_cost NUMERIC(12, 2);
