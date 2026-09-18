-- Per-branch operating hours, editable by Owner on Settings. Used to trim
-- the Dashboard analytics chart's TODAY view to real store hours instead of
-- a hardcoded guess (no such concept existed anywhere in this schema before).
ALTER TABLE branch ADD COLUMN opening_time TIME NOT NULL DEFAULT '08:00:00';
ALTER TABLE branch ADD COLUMN closing_time TIME NOT NULL DEFAULT '19:00:00';
