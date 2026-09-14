# Backlog

Open, not-yet-scheduled work. Carried forward across sessions — check off and move to `handoff.md`/`DECISIONS.md` once actually picked up.

## Open questions blocking Phase 0 (from `docs/project-initiation-draft.md` §5)

Each has a stated default in the source document, so none of these are hard blockers — but each should get a real answer from the owner/manager rather than silently running on its default.

- [ ] **Q1** — Customer-facing storefront vs. staff-only checkout. Biggest open fork; determines whether Phase 3A exists at all. Default if unanswered: staff-only.
- [ ] **Q2** — Powder-coating / service-booking module in-scope or handled outside the system. Determines whether Phase 3B exists. Default if unanswered: out of scope.
- [ ] **Q3** — Notification channels: customer-facing, internal-only, both, or neither. Default if unanswered: internal-only email (low-stock to manager).
- [ ] **Q4** — Payment method scope: GCash only vs. GCash + other e-wallets/cards, and whether a real gateway integration is wanted from Phase 1. Default if unanswered: manual confirmation, no gateway.
- [ ] **Q5** — Multi-branch inventory/sales sync behavior: independent per branch, or shared/visible across both. Default if unanswered: one shared backend/DB, cross-branch read visibility for manager/owner, no stock-transfer feature.
- [ ] **Q6** — Confirm the ChardWorkz schema is designed fresh, not copied from any thesis. Default if unanswered: yes, fresh schema (already the working assumption).
- [ ] **Q7** — Audit logging from Phase 0 or later. Default if unanswered: minimal `audit_event` table in Phase 0 covering price/stock-level changes only.
- [ ] **Q8** — Sale/service correction handling: void-before-finalize, cancel-before-start, both, or neither. Default if unanswered: void-before-finalize only, no post-finalization reversal.
- [ ] **Q9** — Reviews/ratings feature, even if deferred past Phase 1. Default if unanswered: out of scope entirely.
- [ ] **Q10** — Production intent: real business deployment, academic-style deliverable, or both. Default if unanswered: real production.
- [ ] **Q11** — Mobile admin parity: confirm managers need full phone parity (stock-in approval, reports) rather than desktop-only admin. Default if unanswered: full parity.
- [ ] **Q12** — Offline/degraded-network behavior at the counter: stop selling, paper fallback, or local queue-and-sync. Default if unanswered: paper fallback with post-hoc re-keying. **Needs deciding before Phase 1 build, not after** — the paper process it replaces has no such dependency.

## Phase 0 scaffolding (once questions above are answered or defaults accepted)

- [ ] Initialize the actual repo (frontend/backend/DB) — nothing exists yet, this is greenfield, not a migration.
- [ ] Design and migrate the normalized schema per the Reference Schema Sketch in `docs/project-initiation-draft.md` §2, reserving `branch_id`, `payment_method`, and `sku`/`barcode` regardless of how Q4/Q5 land.
- [ ] Implement account auth with role claims (Manager/Employee/Owner) — Spring Security + JWT + Bcrypt.
- [ ] Build the responsive shell and `LayoutService` breakpoint system before any feature module (explicitly called out in the roadmap as the most common place this kind of scope slips if skipped).
- [ ] Stub the notification interface (`EmailSender` via Spring Mail implemented; `SmsSender` interface only, no implementation).

## Project housekeeping

- [ ] Confirm the `owner` field set in `PROJECT-CONTEXT.md`/`memory.md`/`handoff.md` ("Eleomar Halaman") is the correct business-side point of contact for ChardWorkz, not just the session user.
- [ ] Decide whether ChardWorkz gets its own git repo (like `E-Commerce` has) once Phase 0 scaffolding actually starts, or continues living purely as vault documentation until then.
