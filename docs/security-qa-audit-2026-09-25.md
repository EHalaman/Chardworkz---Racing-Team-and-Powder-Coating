---
title: Security & QA Audit — Admin Session, Real-Time Sync, Reports Date Range, RBAC Revocation
type: audit
status: open
created: 2026-09-25
updated: 2026-09-25
ai_generated: true
---

# Security & QA Audit — 2026-09-25

Source: an external pasted audit ("4 tickets") was checked against the actual
frontend/backend source before writing anything up — see
[[feedback_verify_external_proposals_against_code]]. Two of the four premises
were materially wrong about what already exists; this doc replaces the pasted
version with what's actually true in the code, plus the real underlying gaps.

## TICKET 1 — Admin route guard: token _presence_ is checked, not _validity_

**Original claim (inaccurate):** "no route guard exists, /admin/dashboard is
fully open to unauthenticated users."

**Actual state (verified):**

- `frontend/src/app/core/auth-guard.ts` — `authGuard` (`CanActivateFn`) is
  wired to the parent `admin` route (`app-routing-module.ts:36`) and redirects
  to `/admin/login?returnUrl=...` when there's no token.
- `frontend/src/app/core/auth-interceptor.ts` — already clears the session and
  hard-redirects to `/admin/login` on any `401` from an API call.
- So a genuinely token-less user is already redirected before the shell ever
  renders. The pasted ticket's premise is false as stated.

**Real bug, narrower than described:** `AuthService.getToken()`
(`core/auth.ts`) returns whatever string is sitting in `localStorage` under
`chardworkz.auth` with **no expiry/validity check**. `authGuard` only checks
"is there a token," not "is it still valid." Backend tokens live 8 hours
(`app.jwt.expiration-minutes:480`, `JwtService.java`).

Net effect: a stale/expired token left in `localStorage` (e.g. from a session
that ended >8h ago, or was deactivated server-side — see Ticket 4) lets the
guard pass and the Dashboard shell mount with empty/zeroed state
(`"Welcome back, !"`, ₱0.00 everywhere) for the moment before its first API
call 401s and the interceptor kicks in. That flash-of-empty-dashboard is what
the pasted ticket actually observed — it's a stale-token race, not an open
door for a truly unauthenticated visitor.

**Fix (scoped to the real gap):**

1. Decode the JWT's `exp` claim client-side in `getToken()` (or a new
   `isTokenValid()`) and treat an expired token as "no session" — clear it and
   fail the guard, same as no token.
2. Optionally: block Dashboard's initial render behind a resolver/loading
   state instead of mounting with zeroed defaults, so even the legitimate race
   window (valid token, first fetch in flight) doesn't show fake ₱0.00 data.

## TICKET 2 — No real-time sync exists (confirmed real gap)

Verified: no WebSocket/SSE code anywhere in `backend/src/main/java` or
`frontend/src`. A `Sale`/`SaleController`/`SaleService` module does exist
(`backend/src/main/java/com/chardworkz/backend/sales/`), so the "POS
transaction commits, other dashboards don't update live" premise is coherent
with the real codebase, just not yet built. This is a genuine architecture
gap — the pasted ticket's proposed design (SSE/WebSocket broadcast on
`SALES_TRANSACTION_CREATED`, Signal/RxJS store patch on receipt) is a
reasonable shape, not verified against any existing partial implementation
because there isn't one.

**Scope note:** no dedicated POS/checkout UI module was found under
`frontend/src` (no `pos`/`checkout`/`cashier` folder) — sales are presumably
entered through an existing screen. Confirm which screen currently creates a
`Sale` before scoping the broadcast trigger.

## TICKET 3 — Reports date filter: confirmed native `<input type="date">`

Verified: `frontend/src/app/reports/reports/reports.html:21` and `:30` are
plain `type="date"` inputs. No date-range-picker library in
`frontend/package.json`. The pasted ticket's premise and requirements
(dual-month, presets, `startDate <= endDate`, cap at today, auto-refilter via
signals) are accurate and reasonable as written — this one needs no
correction, just implementation.

## TICKET 4 — JWT revocation gap is real; toggle + self-lockout guard already exist

**Already implemented (contrary to the pasted ticket's framing):**

- Bidirectional Active/Inactive toggle: `roles.ts:90` `toggleActive()` →
  `accountsService.setActive(id, !active)` → backend
  `AccountController.updateStatus` (`PATCH /api/accounts/{id}/status`).
- Owner self-deactivation guard, **both** UI and API:
  - UI: `roles.ts:108` — `canDeactivate` is false when `role === 'OWNER'` or
    `isSelf(account)`.
  - API: `AccountController.updateStatus` throws `400` if
    `!request.active() && id == callerAccountId`; separately `update()`
    (role/branch reassignment) refuses to touch an `OWNER` account at all.

**Real gap:** `JwtAuthenticationFilter` — by its own doc comment — "trusts the
JWT's own claims rather than hitting the database on every request: the token
is the source of truth for the lifetime of its expiration window." Deactivating
an account (`active=false`) does **not** invalidate already-issued tokens.
Combined with the 8-hour token lifetime, a just-deactivated employee keeps
full API access for up to 8 hours. No WebSocket exists (see Ticket 2), so
"disconnect the client's live connection" isn't applicable yet — that part of
the pasted ticket only makes sense once Ticket 2 is built.

**Fix (scoped to the real gap):**

1. Add a `tokenVersion` (or `updatedAt`-based) claim to the JWT at login;
   store the same value on `Account`. On deactivate (or any account mutation
   you want to force re-auth for), bump it.
2. `JwtAuthenticationFilter` (or a lightweight check in the account-touching
   endpoints) compares the claim's version against the current DB value and
   rejects with `401` on mismatch — this does mean one DB read per request
   for that comparison, a deliberate trade against the filter's current
   zero-DB-read design; worth confirming that trade-off before implementing.
3. Once Ticket 2's broadcast channel exists, also push a forced-logout event
   to the deactivated user's socket.

## Priority

1. Ticket 4's revocation gap — real security exposure, backend-only fix, no
   new infra needed.
2. Ticket 1's expiry check — small frontend fix, removes the confusing
   zeroed-dashboard flash.
3. Ticket 3 — pure UI/UX, no backend dependency.
4. Ticket 2 — largest scope (new infra: WebSocket/SSE), and item 3 of Ticket
   4's fix depends on it, so sequence it after deciding on Ticket 4.
