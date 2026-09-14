---
title: "ChardWorkz — Project Context"
type: project-context
status: draft
owner: "Eleomar Halaman"
created: 2026-09-07
updated: 2026-09-11
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Project Context

## Objective

Replace ChardWorkz Racing Team and Powder Coating Services' fully paper-based sales and inventory process (two branches: main + Masinag) with a role-based, responsive web Point-of-Sale and Inventory System — fast counter transactions, a single real-time source of truth for stock, manager-controlled accounts/catalog, and owner-level read visibility. Full detail lives in `docs/project-initiation-draft.md` (v0.3), synthesized from three reference thesis capstones (not literal templates — see that document's Reconciled log).

## Users

- **Employee** — runs the counter: product search, cart, cash/GCash tender, on-screen receipt.
- **Manager** — product CRUD, employee accounts, stock receiving, reports; needs phone parity (approve stock-in and read reports from a phone), not desktop-only.
- **Owner** — read-only monitoring across both branches, for transparency.
- **Customer** *(conditional — gated on Q1)* — public storefront browsing/cart/checkout/order-tracking, only if Phase 3A is greenlit.
- **Technician** *(conditional — gated on Q2)* — powder-coating job intake/status, only if Phase 3B is greenlit.

## Constraints

- **No production stack exists yet.** This project is at the initiation stage — no repo, no code. Do not assume any of the below is implemented; it is the target architecture.
- **Target stack (resolved, not open):** Angular (NgModules) + Tailwind CSS frontend; Spring Boot (Java/Maven) backend; PostgreSQL; Spring Security + JWT + Bcrypt auth (uniform across all roles).
- **Responsive web only, no native app.** One Angular build across three breakpoint classes (counter desktop / staff tablet / phone). Mobile parity for managers is a requirement, not an afterthought — see `memory.md`.
- **Three source theses are reference patterns only, never literal templates.** None of their data dictionaries, payment scopes, or security approaches are copied as-is — each has a documented defect (see `docs/project-initiation-draft.md` §0 Reconciled log).
- **Phase 1 is staff-only until Q1/Q2 are answered.** Customer storefront and the powder-coating job module are explicitly gated, separately-attachable phases (3A, 3B) — not assumed into the MVP.
- **Barcode scanning, card payments, and returns/exchanges are out of scope for Phase 1** (see the Out-of-Scope table in the initiation draft for each item's revisit phase).

## Current Phase

**Phase 0 — Foundation, not yet started.** The initiation draft (v0.3) is complete and the schema/architecture direction is set, but 12 open questions in §5 of that document — most importantly **Q1** (customer storefront vs. staff-only) and **Q2** (powder-coating job module) — are still pending answers from the business owner/manager. Each question has a stated default so Phase 0 scaffolding is not blocked, but the defaults are working assumptions, not decisions.

**Immediate next action:** get Q1–Q12 answered (or explicitly confirm the stated defaults), then scaffold the repo per Phase 0 in the roadmap.

## Authorities

Ranked by what overrides what when documents disagree:

1. **The business owner/manager's direct answers** to the open questions in `docs/project-initiation-draft.md` §5 — always wins over any thesis or default.
2. **`docs/project-initiation-draft.md`** — the canonical requirements, architecture, and roadmap document. Anything else in this project should trace back to it.
3. **`memory.md`** — durable decisions and constraints distilled from the initiation draft, for quick reference without re-reading the full document.
4. **`DECISIONS.md`** — dated log of individual decisions, each with its consequence.
5. **`handoff.md`** — current execution state and next action; the first file to read when resuming work.
6. **`backlog.md`** — unscheduled work, including the still-open questions themselves.
7. The three `ChardWorkz_Thesis*_Summary.md` files and `RELATED DOCUMENTS/` — reference material only, explicitly not authoritative (see Reconciled log R3, R6).
