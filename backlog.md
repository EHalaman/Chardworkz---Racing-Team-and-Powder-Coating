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
- [ ] **Audit log data-volume mitigation (deliberately not built)** — table partitioning by month, soft-delete/`deleted_at` on `activity_log` itself, DB indexes beyond the two already added, and cold-storage archiving to Cloudflare R2 for entries older than 90 days. Explicitly deferred as premature at current volume (~30-200 events/month) — revisit only once real activity_log row counts are large enough that unpartitioned Postgres indexes start struggling, not on a fixed calendar date. **Re-confirmed 2026-09-17 (DEC-050)**, when a near-identical external proposal asked for this to be built for real: `activity_log` was created 2026-09-16 and is still empty, and no Cloudflare R2 account/bucket exists in this project. **Re-confirmed again 2026-09-17 (DEC-054)** with a third near-identical proposal, this time after locking Railway/Vercel/Cloudflare R2 as the actual confirmed hosting stack — live-checked the dev DB directly: `activity_log` held 29 rows / 80 kB, nowhere near a real problem. Design outline, kept here for whenever there's a real signal instead of a hypothetical one:
  - **Hot tier (Postgres, 0–90 days):** `PARTITION BY RANGE (occurred_at)` (note: the actual column is `occurred_at`, not `created_at`), one partition per month, composite indexes on `(branch_id, occurred_at)` and `(actor_id, occurred_at)`.
  - **Cold tier (Cloudflare R2, >90 days):** a monthly `@Scheduled` job exporting expired partitions to gzipped JSON at `chardworkz-audit-archives/YYYY/MM/`, then dropping that partition.
  - **Archive read path:** `GET /api/v1/activity-logs/archive` streaming the matching R2 object(s) for Owner/Manager requests reaching past 90 days.
  - **Revisit trigger (concrete as of DEC-054):** `activity_log` crossing ~1,000,000 rows (~150 MB), or overall Postgres disk usage reaching 50% of the Railway volume/plan limit in use at the time — whichever comes first. No longer a vague "when it becomes a problem."
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

- [x] **Dev-environment bug, not a real app bug**: on the `local` H2 profile, H2 `2.4.240`'s PostgreSQL-compat mode threw spurious CHECK-constraint violations (SQLState 23514) on `account` and `sale` INSERTs with entirely valid data — surfaced to the client as a misleading 409 "Username already taken" or a 500 `UnexpectedRollbackException`. **Fixed 2026-09-23**: pinned `com.h2database:h2` to `2.3.232` in `backend/pom.xml` (the version Flyway's own startup warning says it's verified against). Confirmed via a live `local`-profile boot: migrations `V1`–`V8` now apply cleanly under H2, where they previously failed.
- [ ] **New, separate dev-environment bug found while verifying the fix above (2026-09-23), still open**: `local`-profile boot now fails at `V9__add_excel_import_action_type.sql` instead. That migration does `ALTER TABLE activity_log DROP CONSTRAINT activity_log_action_type_check`, relying on Postgres's automatic naming convention for the unnamed inline `CHECK` in `V5__add_activity_log_and_permission_flags.sql`. H2 names that same implicit constraint differently, so the drop fails with "constraint not found" (H2 error code 90057). **Deliberately not fixed by editing `V9` directly** — `V9` has already been applied to the real local Postgres `chardworkz` DB, and this project's standing convention is to never edit an already-applied migration (would break Flyway checksum validation there). User's explicit decision (2026-09-23): keep using real Postgres for all local dev/testing rather than the `local` H2 profile; H2 stays broken past `V8` until this is picked up for real, via either a portable forward migration or an explicit `flyway repair` on the dev Postgres DB alongside a `V9` edit.
- [ ] Roll the same tactile/animation treatment applied to Inventory's Receive Stock combobox and pagination controls to the rest of the app per DEC-046's still-open backlog item above, now that Inventory itself has picked up more interactive surface area (combobox, sort dropdown, clearable filter badge) this session.

## Recent Sales search & cashier filter (DEC-049, 2026-09-17)

- [x] Unified Recent Sales search (customer name, transaction ID, cashier, payment reference) across the full selected date range, and a searchable cashier combobox — done (`DECISIONS.md` DEC-049): `GET /api/reports/sales/search` + `GET /api/reports/cashiers`.
- [x] Live-verified as Manager (`manager2`, MASINAG branch) against real Postgres: transaction-ID substring search (`0004`) correctly narrowed 20 sales to the 2 real matches; `Customer: Maria` correctly scoped to customer-name-only and found the 1 real match; the cashier filter correctly narrowed to just that cashier's 5 sales and its ✕ correctly reset to the unfiltered top-20; the aggregate cards (totals/breakdowns) never changed while searching, confirming the separate-endpoint design works as intended. Browser automation's coordinate-based clicking was unreliable in this session (a tooling quirk, not an app bug — confirmed via `elementFromPoint` that the real inputs sit exactly where expected), so verification used real DOM input/click events dispatched via JS instead of simulated mouse coordinates; worth a normal-mouse pass too next time someone's at the actual keyboard.

## Dashboard chart not rendering on mobile (DEC-053, 2026-09-17)

- [x] Fixed: Dashboard's "Inventory Statistics" bar chart (and the Sales Overview doughnut, same root cause) mutated its bound `ChartConfiguration` object in place instead of assigning a new reference, so `ng2-charts`' `BaseChartDirective` (which only redraws on `ngOnChanges`) never reliably picked up real data - it came down to a race between the summary API response and the chart's first paint, which real phones lose far more often than a warm desktop session. Fixed with an explicit `@ViewChild(BaseChartDirective).update()` call after both chart objects are mutated. See `DECISIONS.md` DEC-053.
- [ ] Not yet checked on real hardware, only via `claude-in-chrome` (both a plain narrow-window reload and the user's "Mobile View" extension) and `ng.getComponent()` data inspection.

## Mobile-native platform fixes & layout plan (2026-09-17)

- [x] Applied `mobile-native` skill's platform-layer fixes: viewport meta (`viewport-fit=cover`, `interactive-widget=resizes-content`), a single `theme-color` meta kept in sync with the app's own dark-mode toggle (not OS `prefers-color-scheme`, since this app's theme is a manual class switch), `overscroll-behavior: none` globally with `overscroll-contain` on Register's own scroll containers (product list, cart, Recent Transactions drawer), `user-select: none`/`-webkit-touch-callout: none` on buttons/links, `hover:` variant tightened to also require `(pointer: fine)`, shell height `h-screen` → `h-dvh`, and safe-area-bottom padding on Register's toast and drawer. Full list and rationale in `docs/mobile-native-layout-plan.md`.
- [x] **Live-checked at a real ~375px width** using the user's "Mobile View" Chrome extension (not emulation guesswork) and found + fixed two real bugs: Inventory's stock-level rows and Products' catalog rows both had a `flex ... justify-between` row where a `shrink-0` action-button group (badge + "Edit reorder point", or badge + Restock/Edit/Deactivate/Delete) squeezed the product name down to 1 truncated character and wrapped "0 in stock" across three lines; Products' search+sort row didn't wrap at all (the input's `min-w-0` let it shrink to near-nothing instead of the row wrapping). Fixed by stacking both rows vertically below `sm` (`flex-col sm:flex-row`) and letting the action-button group itself wrap (`flex-wrap`) as a safety net. Both re-verified visually in the same mobile-view frame after the fix.
- [ ] **Not yet verified on real hardware** — compiles clean and spot-checked live in a desktop browser tab (plus the mobile-view width check above), but per the skill's own Hard Rule 5, sticky hover, tap-highlight, `100dvh` tracking the URL bar, input-zoom prevention, overscroll containment, and safe-area padding cannot be confirmed without a real phone. Connect one before calling this done.
- [ ] **Register and Activity Log/Roles haven't had the same narrow-width visual check yet** — Dashboard, Register, Reports, and now Products/Inventory have been checked; Activity Log and Roles still need the same pass, since they likely have similar `shrink-0` action-button rows.
- [ ] **The real structural gap — built 2026-09-29 (DEC-089) but REVERTED 2026-09-30 at the user's request (`DECISIONS.md` DEC-090); do NOT change the navbar unless the user asks again.** It had made `Layout`'s shell show a bottom tab bar (reusing the existing role-filtered `navItems`, icons shared with the desktop dock via one `ng-template`) below `sm`, dock hidden below `sm`/bar hidden at `sm+`; tab strip replaced by a page-title span below `sm`. See `docs/mobile-native-layout-plan.md` §3 for the original plan this followed.

## UI/UX proposal rollout: checkboxes, receipt remarks, mobile grid, edit modals, bottom tab bar (DEC-088/DEC-089, 2026-09-28/29)

- [x] Service Package Edit drawer UI/UX polish + a real `PackageController.update()` flush-ordering bug fix (`package_item` unique-constraint 500 on edits that kept an existing component) — done 2026-09-28, `DECISIONS.md` DEC-088. **Not yet committed.**
- [x] Parts-checklist checkbox styling fix (`products.css`'s new scoped `.part-checkbox`, dead `@tailwindcss/forms`-dependent classes replaced) — DEC-089.
- [x] Dual-tab receipt no longer leaks excluded-component prices/quantities onto the printable Customer tab (`core/utils/remarks.util.ts`) — DEC-089. Applies retroactively to historical sales too (render-time transform, no migration).
- [x] Sales Reports mobile card-label clipping fixed (`By payment method`/`By branch`/`Top products`) — DEC-089.
- [x] Roles: inline-row account edit replaced with a centered "Edit Staff Account" modal — DEC-089.
- [x] Products: "Edit Service Package" moved out of the "New" panel into its own centered modal — DEC-089.
- [ ] **Open cleanup from the 2026-09-30 `/code-review high` (DEC-090; the New-draft clobbering, Bundle-savings DOM read and modal Escape/backdrop/vanish findings were fixed the same day):** ~180 lines of create/edit package form duplicated; duplicated auto-grow textarea logic; add unit tests for `formatRemarksForCustomer` and share one constant for the exclusion row format between `register.ts` and `remarks.util.ts`.
- [x] Code-review fixes done 2026-09-30 (DEC-090): remarks truncation on whole-line boundary, duplicate `productId` 400 in `PackageController` (+ test), guarded first-tab priming in `Layout`, no `truncate` on Dashboard money values.
- [x] Dashboard KPI cards (Avg Order Value / Gross Margin / Parts Revenue / Labor Revenue) no longer overlap on phones — single column below `sm`, `truncate` on values, `break-words` on subtext — DEC-090. iPhone SE (375px) not separately checked.
- [x] **FIXED 2026-09-30 (`DECISIONS.md` DEC-090) — `Layout.ngOnInit()` now primes the tab/title via `syncActiveTab()` from `router.getCurrentNavigation()?.finalUrl ?? router.url`; verified live on desktop. Original report below, kept for history.** Bug found 2026-09-29 while verifying the bottom tab bar. `Layout`'s page title/workspace-tab-strip both render blank until a second in-app navigation happens, on **any** fresh hard load of an `/admin/*` route (confirmed on `/admin/dashboard`, reproduced across multiple subsequent nav clicks in the same session — not a one-off). This is pre-existing (the desktop tab-strip had the identical symptom before today's phone-title span was even added), just newly noticed because the phone header made it visible in a spot people actually look at.
  - **Root cause**: `Layout.ngOnInit()` (`frontend/src/app/layout/layout/layout.ts`) subscribes to `this.router.events.pipe(filter(e => e instanceof NavigationEnd))` to populate `openTabs`/`activeTabPath`. `Layout` is itself instantiated by the router as part of activating the very first `/admin/*` navigation on a hard load — so by the time its constructor/`ngOnInit` run and the subscription attaches, that first `NavigationEnd` has already been emitted and is gone (`Router.events` is a plain `Subject`, not replayed). Every _subsequent_ in-app navigation should be caught fine by the same subscription — if it isn't (this session's live testing suggested it wasn't, though that was inside a flaky Mobile View split-frame environment and not conclusively isolated from that), the bug is more than just the missed-first-event race and needs fresh reproduction in a normal single-tab session before diagnosing further.
  - **Likely fix**: prime `activeTabPath`/`openTabs` synchronously from the _current_ route in `ngOnInit` (before/alongside subscribing), e.g. read `this.router.url` + the already-activated route snapshot's `data['title']` once up front the same way the subscription callback does, instead of relying entirely on catching a future `NavigationEnd`.
  - **Why this matters for prod**: if this ships, every user's _very first_ page after login (or after a hard refresh) shows a blank page title on phone and a blank/no tab chip on desktop, self-correcting only once they click a second nav item. Cosmetic, not data-breaking, but jarring on first impression — worth fixing before or shortly after this batch reaches production. Check here first (`DECISIONS.md` DEC-089's own entry cross-references this).

## Dashboard financial/operational KPIs (DEC-056, 2026-09-17)

- [x] Avg Order Value, Gross Margin (Parts) with a visible known-cost-coverage caveat, Parts/Labor revenue split, Stock Value at Cost, payment-method breakdown, Top Margin Parts/Top Workshop Services tabs, Owner branch filter, and per-product actionable stock alerts with a suggested reorder quantity (3-month run rate) that deep-links into Inventory's Receive Stock form with both product and quantity pre-filled. See `DECISIONS.md` DEC-056 for full detail and live-verification notes.
- [ ] **Declined: Workshop Bay Utilization Widget** — this is, in substance, the Technician/job-tracking module Q2 already deferred (Phase 3B: powder-coating job intake/status). Would need a real job/technician/bay-status data model designed from scratch if ever revisited — not a dashboard add-on.
- [ ] **Declined: full chart/visualization overhaul** — the dual-axis capital-vs-COGS bar chart, the dual-ring (parts/labor + payment-method) donut replacing the sales-goal gauge, and a dead-stock/aging-velocity overlay were all out of scope for this pass (the user chose "quick wins + branch filter + reorder suggestions", not the chart-library rework). The data needed for most of these (category split, payment method, last-sold-date per product) is already available via the endpoints built this session if picked up later.
- [ ] **Declined: Draft-PO / 1-click purchase-order system** — no purchase-order entity exists anywhere in this app; the reorder alerts link into the existing Receive Stock form (pre-filled) instead of a new PO workflow. Revisit only if a real multi-step procurement flow (draft → approve → receive) is actually wanted.
- [ ] Inventory turnover / Days Sales of Inventory (DSI) was in the original proposal but not built this session (not part of the "quick wins" the user picked) — computable later from the same cost-approximation data (`estimatedCostTotal`) plus average inventory value over a period.

## Public Catalogue page (`/catalogue`, customer-facing site, 2026-09-23)

- [x] Built the public `/catalogue` page (`customer_home/catalogue/`) — hero studio-angle viewer (6 real Raider photos, drag/swipe/click stepper), and a "Browse by Category" grid of all 61 real Suzuki PH figures (ENGINE/TRANSMISSION/ELECTRICAL/BODY), each scraped live from `mc.suzuki.com.ph/genuine-part/raider-r150-fi/` with a real FIG code, title, and diagram image (`catalogue-figures.data.ts`) — zero placeholder/broken images, verified via real `load`/`error` events on all 61.
- [x] Built the real Schematic Inspection View (hotspot diagram + synced parts table) for one figure — CYLINDER HEAD COVER (`catalogue-cylinder-head-cover.data.ts`) — with verified real part numbers/prices, hotspot coordinates measured directly against the real image (not guessed), and a top/bottom tooltip-flip fix so it never clips near the diagram's top edge.
- [x] **Built the same Inspect Diagram (hotspot + synced parts table) view for all remaining 60 figures — done 2026-09-25 (DEC-078).** All 61 of 61 figures now show "Inspect Diagram" with real verified per-part breakdowns and measured hotspot coordinates; none fall back to link-out-only anymore. Not yet spot-checked live in-browser for the final 11 (LABEL through UNDER COWLING) — verified so far only via `npx tsc --noEmit` and the measurement pipeline's own marker-overlay images. See `handoff.md`'s top open item.

## Project housekeeping

- [ ] Confirm the `owner` field set in `PROJECT-CONTEXT.md`/`memory.md`/`handoff.md` ("Eleomar Halaman") is the correct business-side point of contact for ChardWorkz, not just the session user.
- [ ] Reconcile `ChardWorkz_Thesis4_Summary.md` against the real `RELATED DOCUMENTS/THESIS4.docx` (currently built from a short user-pasted synopsis only, not the source document).
- [ ] Manager and Employee currently have no self-service way to change their own password (Settings is Owner-only per DEC-036) — flag if that turns out to matter in practice; would need either a small always-open `/api/accounts/me/password`-style endpoint outside the Owner-only controller gate, or a scaled-down Settings view for non-Owner roles.
