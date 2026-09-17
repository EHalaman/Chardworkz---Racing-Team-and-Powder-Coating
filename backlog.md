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
- [x] Role-gate a real endpoint with `@PreAuthorize` — done 2026-09-15 (`DECISIONS.md` DEC-028): `/api/accounts` is Owner-only, the app's first real per-role gate. `/api/ping`, `/api/auth/**`, `/api/sales`, and `/api/products` remain open to any authenticated account role, deliberately.
- [x] Build the responsive shell before any feature module — done 2026-09-15 (floating dock + workspace tabs + role-filtered nav), see `docs/frontend-design-conventions.md`.
- [ ] Stub the notification interface (`EmailSender` via Spring Mail implemented; `SmsSender` interface only, no implementation) — still not started; low priority since Q3 deferred notifications past Phase 1.
- [x] Frontend HTTP/auth plumbing (`AuthService`, `authInterceptor`, `environments/`) — done 2026-09-15 as part of the offline queue work (DEC-026).
- [x] Real login page + route guard — done 2026-09-15 (`DECISIONS.md` DEC-027): `auth/login/`, `core/auth-guard.ts`, routing restructured so `/login` renders outside the shell. `Layout`'s fake "Viewing as" switcher is gone, replaced by the real JWT-derived user.
- [x] Route-level role enforcement — done 2026-09-15 (`DECISIONS.md` DEC-029): `core/role-guard.ts` as `canActivateChild` on the `Layout` route, reusing `Layout.ALL_NAV_ITEMS` as the single source of truth. Verified live: a Manager hitting `/roles` and an Employee hitting `/dashboard` both correctly redirect instead of loading.

## Next feature screens (frontend)

- [x] Register — done 2026-09-15 (`DECISIONS.md` DEC-027): search-and-list product lookup, cart, payment method, instant-confirmation checkout into the offline queue. Verified live including a full offline-outage-and-recovery cycle through the real UI.
- [x] Roles — done 2026-09-15 (`DECISIONS.md` DEC-028): Owner-only staff account creation/list/activate-deactivate, backed by the app's first `@PreAuthorize` role gate. Verified live including logging in as a brand-new (non-bootstrap) Manager account created through the real form.
- [x] Products — done 2026-09-15 (`DECISIONS.md` DEC-031): Owner/Manager catalog CRUD (create/edit/deactivate-reactivate), verified live including Register's active-only feed updating immediately and the Employee role gate.
- [x] Inventory — done 2026-09-15 (`DECISIONS.md` DEC-032): Owner/Manager stock levels, reorder-threshold editing, and stock receiving (using the pre-existing `stock_in`/`supplier` entities). Verified live including the Employee role gate.
- [x] Inventory: Owner any-branch view/restock — done 2026-09-15 (`DECISIONS.md` DEC-034): Owner can now view/restock/edit-reorder-thresholds for either branch, not just their own account's branch; Manager stays own-branch-only per the DEC-033 precedent.
- [x] Inventory: Owner branch-overview cards — done 2026-09-15 (`DECISIONS.md` DEC-035): at-a-glance per-branch products-in-stock/low-stock counts so Owner can spot a restock problem without switching branches first.
- [ ] Branch-to-branch stock transfer — not built. Surfaced by an external multi-branch-inventory proposal (2026-09-15); genuinely new (no entity/audit-trail exists for it, unlike receiving), so it's a real feature to scope, not a quick extension. Would need a `stock_transfer` entity mirroring `stock_in`'s audit pattern (from-branch, to-branch, product, quantity, who, when), decrementing one branch's `stock_level` and incrementing the other atomically.
- [x] Sales Reports — done 2026-09-15 (`DECISIONS.md` DEC-033): Owner (cross-branch) / Manager (own-branch) revenue, breakdowns, and recent sales. Verified live across all three roles.
- [x] Settings — done 2026-09-16 (`DECISIONS.md` DEC-036): Owner-only account profile (name/password), branch renaming, and a shared dark-mode toggle; notifications shown as a "future phase" notice per Q3. Verified live including Manager/Employee both losing access. This was the last screen rendering the generic `Placeholder`.
- [x] Dashboard — done 2026-09-16 (`DECISIONS.md` DEC-037): replaced all mock KPIs/chart/alerts/activity/top-products with real data composed from existing Products/Inventory/Sales endpoints, a real notification bell, and a new `/activities` full-history page. See "Product categories & sales goal" and "Raider parts catalog seed" below for the schema work that went with it.

## Product categories & sales goal (from the Dashboard audit proposal, 2026-09-16)

- [x] Add `product.category` (CARB/FI/OTHERS/SERVICES) with a Products-screen filter/badge — done (`DECISIONS.md` DEC-037), migration `V3`.
- [x] Add a per-branch `monthly_sales_goal`, editable in Settings, driving the Dashboard's Sales Goal donut — done (`DECISIONS.md` DEC-037), migration `V3`.
- [ ] Manager/Employee self-service password change is still not available (see "Project housekeeping" below) — unrelated to this batch, just still open.

## Raider parts catalog seed (from the Dashboard audit proposal, 2026-09-16)

- [x] Seed the Suzuki Raider R150 FI OEM parts (17 items, category `FI`) alongside the existing generic test products — done (`DECISIONS.md` DEC-037), migration `V4`.
- [ ] **Prices are AI-estimated placeholders, not real retail/supplier prices** — the business owner explicitly accepted this "to edit later." Correct them via the real Products screen before they're relied on for any real sale. Not tracked per-item here; check `V4__seed_raider_parts.sql`'s product list against real pricing when available.
- [ ] Generic 'test' products were deliberately left in place, not deleted, alongside the Raider parts — a cleanup pass (deactivate or remove test data) is a separate, explicit decision for later, not bundled into this seed.

## Service vs. physical items & Shift Summary (from a UI-review proposal, 2026-09-16)

- [x] Exclude SERVICES-category products from all stock-tracking logic (Inventory list/receive/reorder-threshold, Dashboard stock value/low-stock/alerts) — done (`DECISIONS.md` DEC-038). Fixed a real latent bug in the process: any SERVICES item would otherwise have shown as permanently "out of stock" everywhere.
- [x] Register shows SERVICES items as "Always available," no stock count — done (`DECISIONS.md` DEC-038).
- [x] "Today's Shift Summary" widget on Register (`GET /api/sales/shift-summary`) — done (`DECISIONS.md` DEC-038): Employee sees branch-wide transactions/cash/e-wallet for today; Manager adds revenue/estimated margin, own-branch-only; Owner gets a cross-branch view + per-branch breakdown (not reachable live today since Owner has no `/register` access — see below).
- [x] Relabeled "Unit Price" → "Selling Price (SRP)" and added a tooltip to "Unit Cost" — done (`DECISIONS.md` DEC-038), reusing the existing plain `title`-attribute tooltip pattern.
- [ ] **Estimated margin is a rough approximation** — it uses each product's most-recently-recorded receipt cost, not real FIFO/weighted-average costing. It's `null`/excluded for any product with no receipt history at all — notably every Raider-seed part (V4 seeded `stock_level` directly without matching `stock_in_line` rows) and any SERVICES item. Revisit if real cost tracking is ever built.
- [ ] Owner cannot currently reach `/register` at all (`Layout.ALL_NAV_ITEMS` doesn't include Owner in that route's roles), so the Shift Summary's Owner/cross-branch view was verified via curl only, never seen live. If Owner ever needs this view, it would make more sense surfaced on the Dashboard (which Owner does see) than by granting Owner Register/POS access.

## UI/UX refinements, RBAC, and Activity Log (from an external proposal, 2026-09-16)

- [x] Header dropdown click-outside handling, alert deep-linking to Inventory, real-time search on Products/Inventory/Sales Reports/Roles, Products pagination+sorting, Products toast — all done (`DECISIONS.md` DEC-039).
- [x] Products Edit/Delete actions, Archived Products view, configurable Manager permission flags (Settings-toggleable) — done (`DECISIONS.md` DEC-040).
- [x] Activity Log page (`/activity-log`) backed by a new `activity_log` table — done (`DECISIONS.md` DEC-041).
- [ ] **Audit log data-volume mitigation (deliberately not built)** — table partitioning by month, soft-delete/`deleted_at` on `activity_log` itself, DB indexes beyond the two already added, and cold-storage archiving to Cloudflare R2 for entries older than 90 days. Explicitly deferred as premature at current volume (~30-200 events/month) — revisit only once real activity_log row counts are large enough that unpartitioned Postgres indexes start struggling, not on a fixed calendar date.
- [ ] Activity logging currently covers Product (create/update/status/delete) and Account (create/status) and Branch (update) mutations only — Inventory's `receive`/`updateReorderThreshold` were deliberately left uncovered this session (Inventory already has its own `stock_in` historical table serving a similar purpose). Extend to Inventory if a "who changed a reorder threshold" audit trail is ever specifically needed.
- [ ] Manager-permission system currently covers exactly two flags (Product edit/delete). If Manager-configurable access is ever needed for other actions (e.g. Roles, Inventory), extend the same `permission_flag` table/`PermissionService.isEnabled()` pattern rather than building a second mechanism.

## Register receipts, customer name, and shift history (from an external proposal, 2026-09-16)

- [x] Customer Name field on Register, printable receipt modal, Recent Transactions drawer with reprint, `GET /api/sales/today` — all done (`DECISIONS.md` DEC-044).
- [x] Investigated the reported Activity Log "All Users" filter bug — could not reproduce; the filter is client-side only (no backend `actorId` param is even sent today). Found and fixed an unrelated `*ngFor` perf smell instead (`DECISIONS.md` DEC-043).
- [ ] The receipt's `transactionNumber` is a display-only approximation (derived from the Shift Summary count at the moment of sale, not an atomic server sequence) — a sale completed on one register while another register's sale is mid-sync could in principle get the same number on its instant receipt. Not a real business key (`sale.id` still is), and not worth solving with a real atomic counter unless this actually causes real confusion in practice.
- [ ] No real "labor cost" field exists for services — a SERVICES line's receipt amount is just its `unit_price`, same as any physical part. If a future need arises to separate "parts cost" from "labor cost" within one service line, that's a new schema concept, not present today.

## Motion & micro-interaction pass (DEC-046, 2026-09-17)

- [ ] Roll the Register-session's motion pattern (delayed-unmount + slide/pop-in/out, `active:scale-*` tap feedback) out to Layout's header dropdowns, Products, Inventory, Activity Log, and Roles — prioritized list in `docs/motion-microinteraction-audit.md` §3. Not done this session to avoid an unconfirmed sweep across ~6 more files.
- [ ] Roles' permission toggle switches are the one genuinely new-component candidate (a real animated on/off thumb, not just a utility-class reuse) — see audit §3, P3.
- [ ] Decide the Blueprint Viewer's data model and rollout, if wanted for real: `shared/blueprint-hotspot/` (new component, this session) has no route/nav/backend behind it. Needs a decision on how part images + hotspot `(x, y)` coordinates get authored, and Owner/Manager/Employee visibility for what would likely be a public-facing showcase page. See audit §4.
- [x] Live-verify DEC-046 in an actual browser — done via `claude-in-chrome` against the `local` H2 profile with a fresh Employee test account; toast/receipt/drawer all animate correctly and clean up with no stuck overlays.

## Zero-stock catalog fix (DEC-048, 2026-09-17)

- [ ] Several old test products (`test55`, `tot`, `te`, `test up`, and similar) that were previously hidden in Archived under the old zero-stock rule are now back in the main catalog with "Out of stock" badges. These are the user's own test data from earlier sessions, not touched this session - worth a pass to delete/deactivate the ones that aren't real products before this catalog is used for anything real.

## Bug fixes & new features (DEC-047, 2026-09-17)

- [ ] **Dev-environment bug, not a real app bug**: on the `local` H2 profile, H2 `2.4.240`'s PostgreSQL-compat mode throws spurious CHECK-constraint violations (SQLState 23514) on `account` and `sale` INSERTs with entirely valid data (e.g. a valid `role` value, a valid `payment_method`) — surfaces to the client as a misleading 409 "Username already taken" or a 500 `UnexpectedRollbackException`. Backend `pom.xml` doesn't pin an H2 version, so it resolves whatever the Spring Boot BOM currently has; pin it back to `2.3.232` (the version Flyway's own startup warning says it's verified against) to fix the `local` profile, or just always use real Postgres for anything that writes accounts/sales during local dev until it's pinned.
- [ ] Roll the same tactile/animation treatment applied to Inventory's Receive Stock combobox and pagination controls to the rest of the app per DEC-046's still-open backlog item above, now that Inventory itself has picked up more interactive surface area (combobox, sort dropdown, clearable filter badge) this session.

## Project housekeeping

- [ ] Confirm the `owner` field set in `PROJECT-CONTEXT.md`/`memory.md`/`handoff.md` ("Eleomar Halaman") is the correct business-side point of contact for ChardWorkz, not just the session user.
- [ ] Reconcile `ChardWorkz_Thesis4_Summary.md` against the real `RELATED DOCUMENTS/THESIS4.docx` (currently built from a short user-pasted synopsis only, not the source document).
- [ ] Manager and Employee currently have no self-service way to change their own password (Settings is Owner-only per DEC-036) — flag if that turns out to matter in practice; would need either a small always-open `/api/accounts/me/password`-style endpoint outside the Owner-only controller gate, or a scaled-down Settings view for non-Owner roles.
