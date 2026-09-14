---
title: "ChardWorkz — Project Memory"
type: memory
status: active
owner: "Eleomar Halaman"
created: 2026-09-11
updated: 2026-09-11
ai_access: internal
ai_generated: true
review_status: draft
canonical: true
---

# Purpose

Durable, reviewed decisions and constraints for ChardWorkz, distilled from `docs/project-initiation-draft.md` (v0.3) and the three thesis reference summaries. Not a session transcript — see `handoff.md` for that.

# Durable Decisions and Constraints

- **No thesis schema, payment scope, or security approach is copied as-is.** All three source theses (THESIS1/2/3) are reference patterns only. THESIS1's data dictionary has visible FK copy-paste drift, THESIS2 has no extractable table-level dictionary at all, and THESIS3 is OCR-corrupted **and** contains two subsections of confirmed unrelated boilerplate (crime-reporting system text in §2.5, book-rental system text in §2.10(1)) — those two subsections must never be treated as real Spares Mart requirements, let alone ChardWorkz ones.
- **Bcrypt hashing, uniformly, for every role.** THESIS3's own code hashes User/Admin passwords with MD5 but Mechanics passwords with bcrypt — an internal inconsistency, not a design choice. ChardWorkz uses Spring Security + JWT + Bcrypt across Manager/Employee/Owner (and Customer/Technician if Phases 3A/3B ship) with no exceptions.
- **Mobile parity for managers is a requirement, not a THESIS2-style limitation.** THESIS2 (the only source that claims "web and mobile") restricted mobile to the customer side only — no mobile admin panel. ChardWorkz explicitly rejects that split: a manager must be able to approve stock-in and read reports from a phone. (Open for final confirmation as Q11, but treated as the default.)
- **`stock_level` is modeled per-branch, separate from `product` identity.** THESIS1's schema put quantity directly on the product row, which made multi-branch representation impossible. ChardWorkz has two real branches (main + Masinag), so quantity must be `product_id` + `branch_id`, from Phase 0.
- **Payment is a `payment_method` enum with an optional reference number, not a boolean.** Absorbs cash (THESIS1), GCash (THESIS2), and card/UPI/net-banking (THESIS3's data model, though none of the three ship real gateway integration) without committing to a gateway. Real gateway integration is a separate pluggable port, deferred pending Q4.
- **`branch_id`, `payment_method`, and `sku`/`barcode` are reserved on their tables from Phase 0** even though multi-branch sync behavior (Q5), payment gateway scope (Q4), and barcode scanning (deferred) are all still open. Reserving the columns now is cheap; retrofitting them later is not.
- **Powder coating is modeled as a `Job` entity, not a `Product`.** No source thesis models a service/labor business; THESIS3's Mechanics module (provider, availability, booking, pricing, reviews) is the nearest structural analog and is generalized into a Job entity (intake → assign technician → status → price). Whether this ships at all is Q2 — not yet decided.
- **Notifications: email now, SMS as an unimplemented interface.** THESIS2 used PHPMailer for order-status/low-stock email; THESIS3 added SMS verification. ChardWorkz implements `EmailSender` via Spring Mail and defines `SmsSender` as an interface with no implementation, so adding an SMS provider later is a wiring change, not a redesign. Channel scope (customer-facing vs. internal-only vs. both) is still open as Q3.
- **The stack itself is resolved and not reopened:** Angular (NgModules) + Tailwind CSS frontend, Spring Boot (Java/Maven) backend, PostgreSQL. One responsive Angular codebase serves all three breakpoint classes (counter desktop / staff tablet / phone) — no native app, no separate mobile codebase.
- **Q1 (customer storefront vs. staff-only) and Q2 (powder-coating job module) are the two decisions that fork the architecture most.** Everything downstream — whether `customer`/`order`/`job`/`technician` tables exist, whether Phase 3A/3B are ever built — depends on these two answers. Both are deliberately kept open rather than defaulted into the design; see `docs/project-initiation-draft.md` §5 for the full question set with stated defaults.

# Related

- Full architecture, roadmap, and reconciliation detail: `docs/project-initiation-draft.md`.
- Dated, individually-tracked decisions: `DECISIONS.md`.
- Current execution state and next action: `handoff.md`.
