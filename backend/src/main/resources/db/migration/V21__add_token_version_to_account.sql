-- Backs immediate session revocation (security-qa-audit-2026-09-25.md, Ticket 4):
-- JwtAuthenticationFilter previously trusted a JWT's claims for its full
-- lifetime with no DB check, so deactivating an account didn't invalidate
-- its already-issued tokens. Bumped on every /api/accounts/{id}/status
-- change; the filter rejects any token whose embedded version doesn't match
-- the account's current one.
ALTER TABLE account ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
