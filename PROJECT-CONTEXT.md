---
title: "ChardWorkz — Project Context"
type: project-context
status: draft
owner: "Eleomar Halaman"
created: 2026-09-07
updated: 2026-09-17
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Project Context

## Change Log

- **2026-09-15 (later)** — All 12 open questions in `docs/project-initiation-draft.md` §5 answered by the business owner. See that document's §0.1 Change Log and each question's **Resolved** line for full detail; `DECISIONS.md` DEC-018/DEC-019/DEC-020 log the decisions. Biggest outcome: **Q12 broke from its stated default** — the register now has a committed Phase 1 requirement to keep selling offline via a local queue that syncs on reconnect, not the paper-fallback default. Constraints and Current Phase below updated accordingly.
- **2026-09-15** — Added `ChardWorkz_Thesis4_Summary.md`, a 4th reference capstone in the same POS/Inventory domain as Thesis 1–3 (built from a short synopsis, not a full source document — see that file's source note). It surfaces two details not explicit elsewhere in the reconciled set: a **suspend-sale** capability (hold an in-progress sale, resume later) and **invoice printing** (THESIS1's receipt is explicitly display-only). Both are candidates for `backlog.md` / `docs/project-initiation-draft.md`, not yet promoted into the resolved scope below. This is reference material only, same as Thesis 1–3 — see Authorities.
- **2026-09-15 (build)** — Reconciles a conflict `DECISIONS.md` DEC-014 flagged back when the frontend shell was first built: the Owner-only "Roles" nav tab (a direct build instruction from the business owner) contradicted this file's own Users section, which said Manager handles employee accounts and Owner is read-only-only. Since staff account creation/management is now actually built (`DECISIONS.md` DEC-028) as Owner-only, the Users section below is updated to match reality rather than carry the stale, never-implemented description forward.
- **2026-09-17** — Hosting target locked (`DECISIONS.md` DEC-054): Vercel (frontend) / Railway (Spring Boot backend + managed Postgres) / Cloudflare R2 (media/asset storage). Previously only an assumption baked into a backlog revisit-trigger's wording, not a recorded decision. See Constraints below.

## Objective

Replace ChardWorkz Racing Team and Powder Coating Services' fully paper-based sales and inventory process (two branches: main + Masinag) with a role-based, responsive web Point-of-Sale and Inventory System — fast counter transactions, a single real-time source of truth for stock, owner-controlled staff accounts, manager-controlled catalog, and owner-level visibility. Full detail lives in `docs/project-initiation-draft.md` (v0.3), synthesized from three reference thesis capstones (not literal templates — see that document's Reconciled log); a 4th reference capstone (Thesis 4) was added 2026-09-15 but has not yet been reconciled into that document — see Change Log above.

## Users

- **Employee** — runs the counter: product search, cart, cash/GCash tender, on-screen receipt.
- **Manager** — product CRUD, stock receiving, reports; needs phone parity (approve stock-in and read reports from a phone), not desktop-only.
- **Owner** — creates and manages staff accounts (any role, including another Owner — DEC-028), plus monitoring across both branches. Broader than "read-only," per the business owner's direct build instruction (DEC-014), reconciled here rather than left as a documented-but-contradicted default.
- **Customer** _(resolved 2026-09-15: not this phase)_ — public storefront browsing/cart/checkout/order-tracking; Q1 confirmed staff-only for now, so Phase 3A stays unbuilt. Documented for if it's revisited.
- **Technician** _(resolved 2026-09-15: not this phase)_ — powder-coating job intake/status; Q2 confirmed skip for now, so Phase 3B stays unbuilt. Documented for if it's revisited.

## Constraints

- **No production deployment exists yet.** `frontend/` and `backend/` scaffolds exist (since 2026-09-15) but hold no real feature modules, no live database, and no auth beyond a permit-all placeholder — treat everything below as the target architecture, not what's deployed.
- **Target stack (resolved, not open):** Angular (NgModules) + Tailwind CSS frontend; Spring Boot (Java/Maven) backend; PostgreSQL; Spring Security + JWT + Bcrypt auth (uniform across all roles).
- **Hosting target (resolved 2026-09-17, DEC-054):** Vercel (frontend static build) / Railway (Spring Boot backend + managed Postgres) / Cloudflare R2 (media/asset storage — separate from R2's other, still-deferred use as `activity_log` cold-archive storage, see `backlog.md`).
- **Responsive web only, no native app.** One Angular build across three breakpoint classes (counter desktop / staff tablet / phone). Mobile parity for managers is a requirement, not an afterthought — see `memory.md`.
- **Three source theses are reference patterns only, never literal templates.** None of their data dictionaries, payment scopes, or security approaches are copied as-is — each has a documented defect (see `docs/project-initiation-draft.md` §0 Reconciled log).
- **Phase 1 is staff-only — confirmed 2026-09-15 (Q1/Q2 resolved).** Customer storefront and the powder-coating job module remain documented, separately-attachable phases (3A, 3B) but are explicitly not being built this phase — not a default anymore, an actual decision.
- **Barcode scanning, card payments, and returns/exchanges are out of scope for Phase 1** (see the Out-of-Scope table in the initiation draft for each item's revisit phase).
- **The register must keep selling through a network outage — confirmed 2026-09-15 (Q12), breaking from the document's stated default.** Local queue + sync-on-reconnect is a committed Phase 1 architectural requirement, not paper fallback. Two accepted, unresolved risks come with this: offline card-authorization is moot for now (no gateway exists — Q4), and a simultaneous multi-register stock oversell during a shared outage is accepted, not solved.
- **This is confirmed real production** (Q10, 2026-09-15) — `05 -Skills/production-security-checklist.md` must be walked against the actual codebase before any real deployment, per the vault's `CLAUDE.md` §6.

## Current Phase

**Phase 0 — Foundation, underway; all 12 gating questions now resolved.** `frontend/` (Angular NgModule + Tailwind, floating-dock shell + role-filtered nav + a real Dashboard page) and `backend/` (Spring Boot 4.1.1 Maven skeleton, permit-all security placeholder, H2 dev profile) were scaffolded 2026-09-15, ahead of the 12 open questions in the initiation draft's §5 being answered — see `DECISIONS.md` DEC-012. Those 12 questions were answered by the business owner later the same day (`DECISIONS.md` DEC-018–DEC-020, `docs/project-initiation-draft.md` §0.1). Schema design and real feature modules are no longer blocked on open questions.

**Immediate next action:** design the real PostgreSQL schema per the (now-updated) Reference Schema Sketch — including the new offline-queue idempotency key from Q12 — and get a real Postgres instance running so `backend/` can be boot-tested against it instead of the H2 dev profile. See `handoff.md` for the full next-steps list.

## Authorities

Ranked by what overrides what when documents disagree:

1. **The business owner/manager's direct answers** to the open questions in `docs/project-initiation-draft.md` §5 — always wins over any thesis or default.
2. **`docs/project-initiation-draft.md`** — the canonical requirements, architecture, and roadmap document. Anything else in this project should trace back to it.
3. **`memory.md`** — durable decisions and constraints distilled from the initiation draft, for quick reference without re-reading the full document.
4. **`DECISIONS.md`** — dated log of individual decisions, each with its consequence.
5. **`handoff.md`** — current execution state and next action; the first file to read when resuming work.
6. **`backlog.md`** — unscheduled work, including the still-open questions themselves.
7. The four `ChardWorkz_Thesis*_Summary.md` files and `RELATED DOCUMENTS/` — reference material only, explicitly not authoritative (see Reconciled log R3, R6). Thesis 4 is not yet covered by that Reconciled log — see Change Log above.
