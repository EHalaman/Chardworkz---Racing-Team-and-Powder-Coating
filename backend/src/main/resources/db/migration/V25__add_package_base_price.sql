-- Lets an admin-created package (DEC-085) set an explicit discounted bundle
-- price instead of always defaulting to the sum of its components. Nullable
-- and untouched for the two DEC-084 dummy packages (V24) - their price stays
-- exactly the sum of default components, same behavior as before this
-- migration. When set, Register's net-total calculation anchors on this
-- instead of the summed default total, still subtracting any excluded
-- optional component's price the same way either way.
ALTER TABLE service_package
    ADD COLUMN base_price NUMERIC(12, 2) CHECK (base_price >= 0);
