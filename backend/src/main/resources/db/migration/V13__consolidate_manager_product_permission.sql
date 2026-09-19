-- Collapses the two granular Manager product permissions (edit, delete) into
-- a single master toggle covering the whole Products catalog page (view in
-- the management sense, add, edit, delete) - simplification requested
-- directly, not a schema change: permission_flag is a flat key/value table,
-- so this is just a row swap, not a column change.
DELETE FROM permission_flag WHERE permission_key IN ('MANAGER_EDIT_PRODUCTS', 'MANAGER_DELETE_PRODUCTS');
INSERT INTO permission_flag (permission_key, enabled) VALUES ('MANAGER_MANAGE_PRODUCTS', false);
