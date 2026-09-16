-- Purpose-built action-level activity feed, separate from the existing
-- field-level `audit_event` (DEC-019/V1) which nothing has ever written to
-- and is shaped for per-field diffs, not a human-facing "who did what" feed.
-- entity_id is text, not a FK, matching audit_event's own precedent - it
-- spans entities with different PK types (bigint vs. sale's uuid).
CREATE TABLE activity_log (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id     BIGINT      NOT NULL REFERENCES account (id),
    actor_name   VARCHAR(150) NOT NULL,
    action_type  VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    entity_type  VARCHAR(50) NOT NULL,
    entity_id    VARCHAR(50),
    branch_id    BIGINT      REFERENCES branch (id),
    summary      TEXT        NOT NULL,
    occurred_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_occurred_branch ON activity_log (occurred_at DESC, branch_id);
CREATE INDEX idx_activity_log_action_type ON activity_log (action_type);
CREATE INDEX idx_activity_log_actor ON activity_log (actor_id);

-- Minimal configurable-permission mechanism: a flat key/value flag table,
-- not a generic per-role policy engine - only two flags exist today
-- (Manager access to Product edit/delete), matching this codebase's
-- preference for the simplest thing that satisfies the actual ask.
CREATE TABLE permission_flag (
    permission_key VARCHAR(50) PRIMARY KEY,
    enabled        BOOLEAN     NOT NULL DEFAULT false,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
INSERT INTO permission_flag (permission_key, enabled) VALUES
    ('MANAGER_EDIT_PRODUCTS', false),
    ('MANAGER_DELETE_PRODUCTS', false);
