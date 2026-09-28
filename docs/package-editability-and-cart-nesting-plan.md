---
title: "Package Editability, Searchable Selectors & Cart Nesting — Plan"
type: plan
status: draft
created: 2026-09-28
ai_generated: true
---

# Source

External "Lead Systems Architect" proposal pasted into chat, referencing 4 screenshots (not attached/visible to this session — description text only). Checked against the real codebase before building, per this project's standing pattern (DEC-082 through DEC-085 etc.).

# Verification against real code

| #   | Proposal claim                                                            | Verdict                                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Labor field is a native `<select>`                                        | **Accurate**                               | `products.html:380-392`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | Parts checklist has no search/filter                                      | **Accurate**                               | `products.html:399-427` — plain scrollable checkbox list, no search input                                                                                                                                                                                                                                                                                                                                                                    |
| 3   | Packages are read-only (Deactivate only, no Edit)                         | **Accurate**                               | `PackageController.java` has only `POST /` and `PATCH /{id}/status` — no `PUT`/edit endpoint at all. `products.html:573-580` confirms only a Deactivate/Activate button.                                                                                                                                                                                                                                                                     |
| 4   | Cart doesn't visually nest package components vs loose add-ons            | **Accurate**                               | `register.html:163-203` — flat `*ngFor` list, package membership shown only as small teal subtext (`· {{ line.packageName }}`), no container/border/badge                                                                                                                                                                                                                                                                                    |
| 5   | Removing a package component from the cart doesn't auto-generate a remark | **Partially wrong, but a real gap exists** | Auto-remarks **already exist** (DEC-084/085) — but only when a component is unchecked in the **pre-add customization drawer** (`togglePackageComponent`/`addPackageToCart`, `register.ts:351-422`). The proposal's own screenshot describes removing an item **already in the cart** (`image_bc2f64.png`) — `removeLine()` (`register.ts:323-327`) is a plain filter with **no remark generation at all**. This is the real, still-open gap. |

## A finding the proposal missed: package rename would silently corrupt old receipts

The proposal's own "Guardrail Analysis" (Requirement 3) correctly worries about template mutation corrupting historical data, and its "Solution" section assumes sale/sale_line already snapshot everything needed. That's **true for price** (`sale_line.unit_price`, `unit_cost` are snapshotted at sale time — confirmed in `SaleLine.java`) but **not true for the package name**: `SaleReceiptResponse.packageName` is resolved via a **live join** to `ServicePackage` at read time (`SaleService.java:83-108`), not stored on `sale_line` itself.

Concretely: if we build the proposed `PUT /api/packages/{id}` and someone renames "Engine Upgrade 206 CC Fi Package" to something else next month, **every past receipt reprint and Sales Audit Breakdown for that package retroactively shows the new name** — a real historical-integrity bug the proposal doesn't anticipate. Fix: add `sale_line.package_name` (nullable, snapshotted at sale time, same pattern as `unit_cost`), migration `V26`.

# Plan (environment-safety-protocol: dev → local staging sim → prod)

## Migration V26 (`add_package_name_snapshot`)

- `ALTER TABLE sale_line ADD COLUMN package_name VARCHAR(150)`
- Backfill existing rows from a live join (best-effort; historical accuracy for pre-V26 rows was already subject to this bug and can't be perfectly recovered)

## Backend

1. **`PUT /api/packages/{id}`** (`PackageController`) — same `@PreAuthorize` as create/status, reuses `CreatePackageRequest` shape (name/description/basePrice/components). Replaces `PackageItem` rows for that package (delete + re-insert, same transaction). Does **not** touch any existing `sale_line` row.
2. **Snapshot `package_name`** in `SaleService.recordSale` alongside the existing `unit_cost`/`unit_price` snapshot logic. `SaleReceiptResponse` reads `sale_line.package_name` directly instead of joining `ServicePackage.name`.
3. **Remarks sanitization**: remarks are already `@Size(max=2000)` and rendered only via Angular text interpolation (auto-escaped, not `innerHTML`) — no XSS gap. Remarks are not included in the Excel exporters (`DEC-060`'s `sanitizeForCell()` scope was export cells, which remarks isn't), so no formula-injection surface exists today. **No action needed** unless remarks gets added to an export later.
4. Branch scoping: already enforced project-wide via JWT-derived branch on every write path (`SaleService`, `PackageController` has no branch concept — packages are global, matching Products). No gap.

## Frontend — Products (`/products`)

1. **Searchable labor combobox** and **parts search input**: this will be the **3rd/4th** hand-rolled combobox in this codebase (Inventory's Receive Stock, Reports' cashier filter already exist as separate hand-rolled instances per DEC-047/DEC-049 — deliberately not extracted before now). Building a 3rd and 4th justifies extracting a small shared `shared/combobox/` component this time rather than a 4th copy-paste — flagging this as a judgment call for confirmation before I build it that way.
2. **Edit button** on each package row, opening the same drawer used for Create, pre-populated via the new `GET /api/packages/admin` data already returned (has `basePrice`, `components[]` with `required`/`quantity`) — calls `PUT` instead of `POST` when editing.

## Frontend — Register (`/register`)

1. **Cart nesting**: group cart lines by `packageId` in the template (mirroring `groupedReceiptLines()` which already does this exact grouping for receipts — reuse the same grouping logic client-side for the live cart, not a new pattern). Package groups get a bordered/tinted container with the package name as a header; ungrouped lines get an `ADD-ON` pill badge.
2. **Auto-remark on cart removal**: `removeLine()` needs to look up whether the removed line had a non-null `packageId` and, if so, append an `Excluded: {name} (-₱{price})` note to `autoExclusionRemarks` and recalc — same message format DEC-085 already established, applied at a second call site.

# Open judgment calls (confirm before building)

1. Extract a shared `shared/combobox/` component now (3rd/4th use), vs. a 4th hand-rolled copy matching the existing inconsistent precedent.
2. `V26`'s backfill of `package_name` for existing sale_line rows: best-effort live-join backfill, or leave pre-V26 rows `NULL` (accepting the display falls back to a live join only for those old rows)?
