# Backlog

Open, not-yet-scheduled work. Carried forward across sessions — check off and move to `handoff.md`/`DECISIONS.md` once actually picked up.

## Q1–Q12 — resolved 2026-09-15

All 12 questions from `docs/project-initiation-draft.md` §5 were answered by the business owner. See that document's §0.1 Change Log, each question's **Resolved** line, and `DECISIONS.md` DEC-018–DEC-021 for the full record. Kept here, checked off, for traceability:

- [x] **Q1** — Staff-only for this phase. Matches default.
- [x] **Q2** — Powder-coating module skipped for this phase. Matches default.
- [x] **Q3** — Notifications skipped for Phase 1. Matches default.
- [x] **Q4** — Manual "mark as paid," no gateway. Matches default.
- [x] **Q5** — One shared backend/DB, main + Masinag visible to Owner/Manager. Matches default.
- [x] **Q6** — Fresh schema, confirmed. Matches default.
- [x] **Q7** — Minimal audit table for price/stock changes, from Phase 0. Matches default.
- [x] **Q8** — Void-before-finalize only, no returns — **but see "Deferred, not rejected" below.**
- [x] **Q9** — Reviews/ratings skipped. Matches default.
- [x] **Q10** — Real production, confirmed. **Triggers a new requirement — see "Pre-deployment" below.**
- [x] **Q11** — Full mobile parity at every breakpoint. Matches default.
- [x] **Q12** — **Broke from the default.** Local queue + sync-on-reconnect (option c), not paper fallback (option b). Real architectural commitment — see "Offline sale queue" below.

## Offline sale queue (new, from Q12)

- [x] Design and build the client-side offline sale queue — done 2026-09-15 (`DECISIONS.md` DEC-026): `OfflineSaleQueueService` (IndexedDB via `idb`), client-generated UUID idempotency key, exponential-backoff retry, terminal `FAILED` state, and a visible sync-status pill in the shell header. Backed by a new idempotent `POST /api/sales` endpoint. Verified live in a real browser against a real backend outage/recovery cycle, not just unit-level.
- [x] Add the idempotency-key field to the `sale` entity when the real schema is designed — done as part of DEC-022 (`sale.id` is the client-supplied UUID).
- [x] Design this _before_ building the Register screen — done; Register (below) is now unblocked.
- [ ] Explicitly not in scope for Phase 1: any conflict-resolution logic for a simultaneous multi-register stock oversell during a shared outage — accepted risk, not solved. (Oversell instead clamps `stock_level.quantity` at 0 per the user's explicit choice, DEC-026.)

## Deferred, not rejected (from Q8)

- [ ] Post-finalization sale reversal — the owner explicitly wants this considered for a later phase, distinct from "out of scope." Revisit once Phase 1's void-before-finalize flow is live and real usage patterns are known.

## Pre-deployment (from Q10)

- [ ] Before any real production deployment (or a production-deployment planning doc), read `05 -Skills/production-security-checklist.md` and walk through it against the actual codebase — per the vault's `CLAUDE.md` §6. Do not treat this as optional now that Q10 confirmed real production.

## Phase 0 scaffolding — mostly done, remainder below

- [x] Initialize the actual repo (frontend/backend) — done 2026-09-15, `frontend/` (Angular) and `backend/` (Spring Boot) both scaffolded and verified running.
- [x] Design and migrate the real normalized schema per the Reference Schema Sketch in `docs/project-initiation-draft.md` §2 — done 2026-09-15 as Flyway migrations + matching JPA entities (`DECISIONS.md` DEC-022), reserving `branch_id`, `payment_method`, and `sku`/`barcode` as planned, plus the new Q12 idempotency key on `sale.id`. Verified against real PostgreSQL 17, see next item.
- [x] Get a real local PostgreSQL instance running and boot-test `backend/` against it — done 2026-09-15 (`DECISIONS.md` DEC-025): PostgreSQL 17 installed locally, both migrations applied cleanly, Hibernate validate passed against all 10 entities, full login round-trip verified.
- [x] Implement account auth with role claims (Manager/Employee/Owner) — done 2026-09-15: real JWT auth (`DECISIONS.md` DEC-024), replacing the permit-all placeholder. Verified end-to-end against the `local` profile.
- [ ] Set real `JWT_SECRET`, `BOOTSTRAP_OWNER_USERNAME`, `BOOTSTRAP_OWNER_PASSWORD`, and `CORS_ALLOWED_ORIGIN` env vars wherever `backend/` actually deploys — the default (non-`local`) config leaves all of these blank on purpose, so production won't boot a working login (or accept any cross-origin frontend call, if ever needed) until these are set.
- [ ] No endpoints are role-gated yet (`@PreAuthorize`) — there's nothing to gate beyond `/api/ping`, `/api/auth/**`, and `/api/sales` (open to any authenticated account role, deliberately). Revisit once real business endpoints (Products, Roles, etc.) exist with actual per-role distinctions to enforce.
- [x] Build the responsive shell before any feature module — done 2026-09-15 (floating dock + workspace tabs + role-filtered nav), see `docs/frontend-design-conventions.md`.
- [ ] Stub the notification interface (`EmailSender` via Spring Mail implemented; `SmsSender` interface only, no implementation) — still not started; low priority since Q3 deferred notifications past Phase 1.
- [x] Frontend HTTP/auth plumbing (`AuthService`, `authInterceptor`, `environments/`) — done 2026-09-15 as part of the offline queue work (DEC-026); a login page and route guard are still not built, deliberately deferred to Register.

## Next feature screens (frontend)

- [ ] Register — highest-value Employee-facing screen (Phase 1 is staff-only). Unblocked now: the offline sale queue it depends on is built and verified, and so is the auth/HTTP plumbing it needs for a real login form.
- [ ] Products, Inventory, Sales Reports, Roles, Settings — all still the generic `Placeholder` component; no content built yet.

## Project housekeeping

- [ ] Confirm the `owner` field set in `PROJECT-CONTEXT.md`/`memory.md`/`handoff.md` ("Eleomar Halaman") is the correct business-side point of contact for ChardWorkz, not just the session user.
- [ ] Reconcile `ChardWorkz_Thesis4_Summary.md` against the real `RELATED DOCUMENTS/THESIS4.docx` (currently built from a short user-pasted synopsis only, not the source document).
