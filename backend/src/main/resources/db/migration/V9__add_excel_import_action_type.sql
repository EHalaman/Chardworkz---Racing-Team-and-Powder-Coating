-- Widens activity_log's action_type CHECK to admit a new EXCEL_IMPORT value,
-- for the Inventory bulk import feature (a bulk stock/reorder-level
-- correction, distinct from a normal single-product CREATE/UPDATE/DELETE).
ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_action_type_check
    CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'EXCEL_IMPORT'));
