-- Distinguishes a real "Delete" action from a plain "Deactivate": both set
-- is_active = false (so existing stock/register visibility rules keep
-- working unchanged), but only Delete also stamps deleted_at, so the
-- Archived page and activity log can tell them apart. Reactivate clears
-- both is_active and deleted_at together.
ALTER TABLE product ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
