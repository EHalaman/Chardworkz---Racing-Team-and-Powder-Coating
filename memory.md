---
title: "ChardWorkz — Project Memory"
type: memory
status: active
owner: "Eleomar Halaman"
created: 2026-09-11
updated: 2026-09-15
ai_access: internal
ai_generated: true
review_status: draft
canonical: true
---

# Purpose

Durable, reviewed decisions and constraints for ChardWorkz, distilled from `docs/project-initiation-draft.md` (v0.4) and the four thesis reference summaries. Not a session transcript — see `handoff.md` for that.

# Durable Decisions and Constraints

- **No thesis schema, payment scope, or security approach is copied as-is.** All source theses (THESIS1/2/3, and THESIS4 as a synopsis-only reference) are reference patterns only. THESIS1's data dictionary has visible FK copy-paste drift, THESIS2 has no extractable table-level dictionary at all, and THESIS3 is OCR-corrupted **and** contains two subsections of confirmed unrelated boilerplate (crime-reporting system text in §2.5, book-rental system text in §2.10(1)) — those two subsections must never be treated as real Spares Mart requirements, let alone ChardWorkz ones.
- **Bcrypt hashing, uniformly, for every role.** THESIS3's own code hashes User/Admin passwords with MD5 but Mechanics passwords with bcrypt — an internal inconsistency, not a design choice. ChardWorkz uses Spring Security + JWT + Bcrypt across Manager/Employee/Owner with no exceptions. **Implemented 2026-09-15** (`DECISIONS.md` DEC-024) — self-issued JWTs (JJWT), stateless filter, `BCryptPasswordEncoder`. No endpoints are role-gated yet since no real business endpoints exist beyond `/api/ping` and `/api/auth/**`.
- **Mobile parity for managers is a confirmed requirement, not a THESIS2-style limitation.** THESIS2 (the only source that claims "web and mobile") restricted mobile to the customer side only — no mobile admin panel. ChardWorkz explicitly rejects that split: a manager must be able to approve stock-in and read reports from a phone. **Confirmed 2026-09-15 (Q11) — full parity at every breakpoint, no longer just a default.**
- **`stock_level` is modeled per-branch, separate from `product` identity.** THESIS1's schema put quantity directly on the product row, which made multi-branch representation impossible. ChardWorkz has two real branches (main + Masinag), so quantity must be `product_id` + `branch_id`, from Phase 0.
- **Payment is a `payment_method` enum with an optional reference number, not a boolean.** Absorbs cash (THESIS1), GCash (THESIS2), and card/UPI/net-banking (THESIS3's data model, though none of the three ship real gateway integration) without committing to a gateway. **Confirmed 2026-09-15 (Q4) — manual "mark as paid," no gateway, for online/GCash payment specifically.**
- **`branch_id`, `payment_method`, and `sku`/`barcode` are reserved on their tables from Phase 0.** Multi-branch sync is now resolved (Q5, below); barcode scanning stays deferred. Reserving the columns now was cheap; retrofitting them later would not have been.
- **Multi-branch: one shared backend/DB, not independent per-branch systems.** **Confirmed 2026-09-15 (Q5)** — main + Masinag stock/sales visible to Owner/Manager from one system, `branch_id`-scoped. No stock-transfer feature built.
- **Powder coating would be modeled as a `Job` entity, not a `Product`, if it ships.** No source thesis models a service/labor business; THESIS3's Mechanics module is the nearest structural analog. **Resolved 2026-09-15 (Q2) — not building for this phase.** Documented for if it's revisited later; not deleted from the roadmap.
- **Notifications: email now, SMS as an unimplemented interface — if/when notifications are built at all.** THESIS2 used PHPMailer for order-status/low-stock email; THESIS3 added SMS verification. **Resolved 2026-09-15 (Q3) — notifications skipped entirely for Phase 1**, not just channel-scope-undecided.
- **The stack itself is resolved and not reopened:** Angular (NgModules) + Tailwind CSS frontend, Spring Boot (Java/Maven) backend, PostgreSQL. One responsive Angular codebase serves all three breakpoint classes (counter desktop / staff tablet / phone) — no native app, no separate mobile codebase.
- **Q1 (customer storefront) and Q2 (powder-coating job module) are resolved: staff-only, no service module — for this phase.** **Confirmed 2026-09-15.** Neither is a permanent no; Phase 3A/3B stay fully documented in `docs/project-initiation-draft.md` §4 for a later milestone. `customer`/`order`/`job`/`technician` tables are not being built now.
- **The register must keep selling through a network outage — this is the single biggest scope addition from the 2026-09-15 resolution round.** **Q12 broke from the document's own stated default** (paper fallback): the owner chose local queue + sync-on-reconnect instead, calling it the modern retail-POS standard for keeping a fast-paced counter moving. This is a committed Phase 1 architectural piece — client-side persistence, a client-generated idempotency key on `sale`, and a visible sync-state indicator — not a later add-on. Two risks are explicitly accepted, not solved in Phase 1: offline card-authorization is moot for now (no gateway exists, per Q4), and a simultaneous multi-register stock oversell during a shared outage is an accepted low risk.
- **This is confirmed real production, not an academic deliverable.** **Q10, confirmed 2026-09-15.** `05 -Skills/production-security-checklist.md` must be walked against the actual codebase before any real deployment (vault `CLAUDE.md` §6) — this is now a standing constraint, not conditional on how Q10 landed.
- **Void-before-finalize only for Phase 1 sale/service corrections; no returns.** **Q8, confirmed 2026-09-15.** With one forward-looking note: post-finalization sale reversal is explicitly flagged for a later phase, not ruled out — tracked in `backlog.md`.
- **Minimal audit logging ships from Phase 0.** **Q7, confirmed 2026-09-15** — `audit_event` covering price and stock-level changes is now unconditional in the schema, not gated.

# Related

- Full architecture, roadmap, and reconciliation detail: `docs/project-initiation-draft.md` (v0.4).
- Frontend shell, palette, typography, and component conventions: `docs/frontend-design-conventions.md`.
- Dated, individually-tracked decisions: `DECISIONS.md`.
- Current execution state and next action: `handoff.md`.
