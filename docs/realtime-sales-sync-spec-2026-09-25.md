---
title: Real-Time Multi-Branch Sales Sync — Technical Spec & QA Ticket
type: spec
status: proposed
created: 2026-09-25
updated: 2026-09-25
ai_generated: true
---

# Real-Time Multi-Branch Sales Sync

Ticket 2 from [[security-qa-audit-2026-09-25]] — this is the spec deferred at
that time pending Tickets 1/3/4. Checked against the real codebase before
writing anything (two details the pasted defect ticket got wrong or left
out, noted below); this replaces its architecture-agnostic ask with a
concrete plan for this stack.

## What's actually true today (verified)

- **No push mechanism exists at all.** No WebSocket/SSE/STOMP dependency
  anywhere in `pom.xml`, no `EventSource`/`SockJS` in the frontend. The
  defect's core premise - "must manually refresh" - is accurate.
- **No `DashboardStore`/`InventoryStore` classes exist** (terminology the
  earlier pasted Ticket 2 draft used). Every screen - `Dashboard`,
  `Register`, `Reports` - is a plain component that injects a service and
  holds its own local signals, refreshed by calling its own existing method
  (`loadShiftSummary()`, `loadReport()`, etc.). Any real-time integration
  has to plug into _that_ pattern, not a store layer that isn't there.
- **Sales don't reach the backend the instant a cashier completes a sale.**
  `offline-sale-queue.ts` (Q12, DEC-confirmed: local IndexedDB queue +
  sync-on-reconnect, not a paper fallback) enqueues locally and syncs via
  `syncNow()` - triggered by the `online` event, a 30s fallback poll, or
  immediately if already online (the common case, near-instant in practice).
  **This means the broadcast trigger must live server-side, in
  `SaleService.recordSale`, not client-side at the moment of local
  checkout** - that's the one moment guaranteed to correspond to a real,
  persisted sale, regardless of how long it sat in a queue first.
- `SaleService.recordSale` is `@Transactional` and has an idempotent replay
  path (`saleRepository.existsById(request.id())` returns early with
  `alreadySynced=true`). A broadcast must fire only on genuine first-time
  persistence, and only _after_ the transaction actually commits - see
  Correctness note below.

## Architecture decision: SSE, not WebSocket

This is a **one-directional, server→client push** need - the client still
creates sales via plain `POST /api/sales`. Nothing here requires a
bidirectional channel. Given that:

- **Recommended: Server-Sent Events.** Native Spring support
  (`SseEmitter`, already available via `spring-boot-starter-webmvc`, zero
  new backend dependency), native browser support (`EventSource`), built-in
  auto-reconnect, works over plain HTTP/1.1 (no new port, no proxy/CORS
  config beyond what already exists).
- **Not recommended: WebSocket/STOMP.** Would add a new dependency
  (`spring-boot-starter-websocket`), a STOMP broker config, and a
  SockJS/STOMP client library on the frontend - solving a bidirectional
  problem this app doesn't have. The pasted defect ticket's "bidirectional
  real-time sync engine" language overstates what's actually needed here.
- **Hosting is compatible with either, but worth stating explicitly:**
  PROJECT-CONTEXT.md's confirmed hosting target (DEC-054) is Railway for
  the backend - a persistent container process, not a serverless function
  platform. A long-lived SSE connection terminates fine there. This would
  be a real constraint (most serverless function platforms cap execution
  time well under what an open SSE stream needs) if the backend were ever
  moved to one - worth re-checking this assumption if the hosting target
  changes before this ships.

## Event design: invalidate-and-refetch, not push-full-state

Two ways to shape the payload:

1. **Push full new state** (e.g. the complete updated shift summary) -
   requires re-deriving every screen's exact aggregation server-side
   (Owner's cross-branch breakdown, Employee's revenue/cost/margin
   redaction per `SaleController#shiftSummary`'s existing role logic,
   Reports' arbitrary date-range filter) inside the broadcast path too -
   duplicating logic that already exists in each REST endpoint, with a real
   risk of the two implementations drifting and one of them leaking
   Owner-only margin data to an Employee's event payload.
2. **Push a minimal invalidation signal, let the client refetch** - the
   event carries just enough to decide _whether_ a given screen cares
   (`branchCode`), and the screen calls its own already-correct,
   already-role-scoped load method again.

**Recommended: (2).** It's less new server logic, cannot leak data the
REST layer wouldn't have leaked anyway (the refetch goes through the exact
same authorization path as a manual refresh does today), and is naturally
idempotent - a duplicate or redundant event just triggers one extra fetch,
never wrong data.

### Event payload

```json
{
  "type": "SALE_RECORDED",
  "branchCode": "MASINAG",
  "saleId": "…uuid…",
  "soldAt": "2026-09-25T10:15:00+08:00"
}
```

No `totalAmount` or SKU/stock fields (per the original pasted ticket's
ask) - deliberately, per the leak-risk reasoning above. If a future screen
needs a live inventory nudge too, add a second, equally minimal
`STOCK_ADJUSTED` event type rather than growing this one.

## Backend implementation plan

1. **`SseEmitterRegistry`** (new, `com.chardworkz.backend.sales.events` or
   similar) - a thread-safe multimap of connected emitters keyed by account
   id (`ConcurrentHashMap<Long, List<SseEmitter>>` / `CopyOnWriteArrayList`
   per key) - **not** one emitter per account. An Owner routinely has more
   than one tab/device open (dashboard on desktop, register-adjacent check
   on a phone); a single-emitter map would let a second connection silently
   evict the first, leaving that earlier tab open in the browser but
   permanently deaf. Removes an emitter on `onCompletion`, `onTimeout`, and
   `onError`. Construct each `SseEmitter` with a `0L` (no) timeout - Spring
   defaults to ~30s and would otherwise close a perfectly healthy idle
   connection - and have the registry send a periodic no-op comment/ping
   (e.g. every 20s) so an idle connection still emits _something_: several
   reverse proxies and load balancers silently kill a connection with no
   bytes for 60s, a classic "works locally, dies in production" SSE trap.
2. **`GET /api/sales/events`** (new endpoint) - returns `SseEmitter`,
   authenticated the same way every other endpoint is (goes through the
   existing `JwtAuthenticationFilter`, no new auth mechanism). Registers
   the emitter, keyed by the caller's account id from JWT claims.
3. **Broadcast trigger - after-commit, not inline.** `SaleService.recordSale`
   is `@Transactional`; broadcasting from inside it directly risks emitting
   before the surrounding transaction actually commits (a subscriber could
   refetch and find nothing yet, if MySQL/Postgres visibility hasn't caught
   up, or the transaction could still roll back after the event already
   fired). Use Spring's `@TransactionalEventListener(phase = AFTER_COMMIT)`:
   `recordSale` publishes a plain `SaleRecordedEvent(branchCode, saleId,
soldAt)` via `ApplicationEventPublisher` right before its early-return
   idempotency check would otherwise skip it (i.e., only on the genuine
   first-time path, never on `alreadySynced` replay); a separate listener
   bean broadcasts it to `SseEmitterRegistry` only once that transaction
   has actually committed.
4. **Branch scoping on send, not subscribe.** Every emitter receives every
   `SaleRecordedEvent` and the registry checks the account's stored branch
   scope before sending - Owner accounts see events from any branch,
   Manager/Employee only their own. (Storing "which account cares about
   which branch" is trivial - it's already on the JWT claims used at
   registration time - so there's no need for per-branch subscription
   channels.)
5. **Close open emitters on deactivation - a direct Ticket 4 interaction.**
   `JwtAuthenticationFilter`'s revocation check (`token_version`, see
   [[security-qa-audit-2026-09-25]]) only runs at the start of a REST
   request. An SSE connection is a single long-lived request - once
   registered, a deactivated account's stream would keep silently receiving
   live sales events for as long as the connection stays open, completely
   bypassing that revocation. `AccountController#updateStatus` (and
   `#resetPassword`, which bumps `token_version` the same way) should call
   `SseEmitterRegistry.close(accountId)` right alongside the existing
   `tokenVersion` bump, forcing that account's stream(s) closed the same
   instant its other sessions are revoked.

## Frontend implementation plan

1. **`SalesEventsService`** (new, `core/` or `register/`) - opens the SSE
   connection and exposes received events as an `Observable<SaleRecordedEvent>`
   (or a signal, matching this app's general signals-first style).
   **Technical decision needed:** native `EventSource` cannot send a custom
   `Authorization` header - the two options are (a) pass the JWT as a query
   parameter (`?token=...`, simple, but a token in a URL can end up in
   server access logs) or (b) use a fetch-based SSE client (e.g.
   `@microsoft/fetch-event-source`, one new small frontend dependency) that
   streams via `fetch()` with normal headers. **Recommended: (b)** - this
   app has been consistently careful about token handling this session
   (Ticket 1's expiry check, Ticket 4's revocation), and a token sitting in
   a URL is the kind of thing that gets flagged in exactly that spirit.
2. **Register, Dashboard, Reports** each inject `SalesEventsService`, filter
   events to branches they currently care about (Register/Employee: own
   branch only; Dashboard/Reports as Owner: whatever `selectedBranch()` is,
   or all if unset), and call their own existing load method
   (`loadShiftSummary()`, the dashboard's analytics load, `loadReport()`) -
   no new data-shape code, this only adds _when_ the existing refresh fires.
3. Reconnect handling is mostly free with either `EventSource` or a
   fetch-based client (both auto-reconnect on drop) - no custom retry logic
   needed. On top of that, have `SalesEventsService` also fire a one-time
   "reconnected" signal each time the stream re-establishes, and have each
   consuming screen treat that the same as a manual refresh (call its own
   load method once). This is the simpler equivalent of "catch up on missed
   events" - a fresh refetch of current state, not a replayed log of every
   delta that happened while disconnected.

## QA bug ticket

**Title:** Real-time sales sync missing across roles/branches (no push
mechanism exists; manual refresh required)

**Scenarios to verify once built:**

1. Employee completes a sale at Masinag → Manager and Owner viewing
   Masinag (or Owner viewing All Branches) see it in Recent Sales and
   shift/report totals without refreshing, within the SSE round-trip
   (order of a second or two).
2. Manager completes a sale or stock receipt at Masinag → Owner and other
   Employees at Masinag see it live, same as above.
3. **Offline-queue edge case (not in the original ticket):** a sale made
   while the register was offline, synced minutes later on reconnect,
   still triggers a broadcast at sync time - other sessions should see it
   appear the moment it actually reaches the server, not silently wait for
   a future manual refresh.
4. A dropped SSE connection (e.g. laptop sleep) reconnects automatically
   and resumes receiving events without a page reload.
5. Duplicate/replayed events (e.g. a network blip causing the client to
   reconnect and possibly re-receive a recent event) cause at most a
   redundant refetch, never wrong or double-counted data - this should
   hold by construction given the invalidate-and-refetch design, but is
   worth an explicit test.
6. An Employee's SSE stream never receives revenue/cost/margin fields
   (there shouldn't be any in the payload at all, per the event design
   above) - a quick payload inspection, not just a UI check.
7. **Multi-tab:** the same Owner account open in two tabs (or desktop +
   phone) both keep receiving events - opening the second connection must
   not silently kill the first's stream.
8. **Ticket 4 interaction:** deactivate an account (or reset its password)
   while its SSE connection is open elsewhere - that stream should close
   immediately, the same moment its `token_version` bump would reject its
   next REST call, not linger until the connection naturally times out.

## Response to the follow-up pasted "engineering blueprint"

A second external draft arrived after this spec's first pass, with a fuller
payload spec and ASCII diagram. Checked against the same real code:

- **`SaleService.processSale()` doesn't exist** - the real method is
  `recordSale()` (see above). `DashboardStore`, `InventoryStore`, and
  `SalesReportsStore` still don't exist anywhere in this codebase, same as
  the first draft's Ticket 2 - both drafts describe a store-layer
  architecture this app doesn't have.
- **That draft's payload spec contradicts its own acceptance criteria.**
  It specifies one shared event payload containing `totalAmount`,
  `paymentMethod`, and per-SKU `itemsSold`/`newStockLevel`, broadcast to
  every subscriber - then separately requires "Cashier sessions receive
  stock and transaction updates without exposing backend COGS or profit
  margin payloads." A single shared payload can't satisfy both: either
  everyone gets the same fields (including whatever an Employee shouldn't
  see) or the backend has to build a _different_ payload per recipient
  role, which is real added complexity the draft never accounts for. The
  invalidate-and-refetch design above sidesteps this entirely - the
  Employee's refetch goes through `SaleController#shiftSummary`'s existing
  role-based redaction (already zeroes revenue/cost/margin for Employee),
  so there's no second place a leak could be introduced.
- **"< 500ms" is an arbitrary number**, not something derived from this
  app's actual requirements - SSE/WebSocket over a normal connection would
  comfortably hit it either way, so it's not objectionable, just not
  adopted here as a hard SLA unless that's a real business requirement.
- **"Catch up on missed events after reconnecting" is a bigger ask than it
  sounds** - taken literally, it means persisting an event log with
  sequence numbers and replaying everything since the client's last-seen
  cursor. The simpler, less-bug-prone equivalent: have the client do one
  normal refetch (through the same existing, already-correct endpoint)
  the moment its SSE connection re-establishes, rather than resuming a
  stream and hoping nothing was missed. Added explicitly to the frontend
  plan above (§3) rather than building a delta-replay mechanism.

## Sequencing

This is the last of the four tickets from the original audit, by design
(see that doc's Priority section) - it's the largest scope (new infra) and
the only one with real architecture decisions to make.

## Proposed implementation plan

Four phases, each independently committable and each leaving the app in a
working state - no phase before the last one changes what any screen
actually shows, so a partial rollout is never a broken or half-working
feature sitting in production.

**Phase 1 - Backend event infrastructure (invisible from the outside).**

- `SaleRecordedEvent` (plain record: `branchCode`, `saleId`, `soldAt`).
- `SseEmitterRegistry` (multimap by account id, per the corrected design
  above), with `register(accountId, emitter)`, `close(accountId)`, and
  `broadcast(event, accountBranchLookup)`.
- `GET /api/sales/events` (new endpoint, likely its own
  `SalesEventController` rather than growing `SaleController`) - registers
  an emitter for the caller, `0L` timeout, periodic heartbeat.
- `SaleService.recordSale` publishes `SaleRecordedEvent` via
  `ApplicationEventPublisher` on the genuine first-time path only; a
  `@TransactionalEventListener(phase = AFTER_COMMIT)` listener bean calls
  `SseEmitterRegistry.broadcast(...)`.
- `AccountController#updateStatus` and `#resetPassword` also call
  `SseEmitterRegistry.close(accountId)`.
- Backend tests: `SseEmitterRegistryTest` (multi-tab register/close,
  mirrors this session's `JwtAuthenticationFilterTest` - mocked, no DB);
  a `SaleService` test confirming no event publishes on the
  `alreadySynced` replay path.
- **Verification gate before Phase 2:** compile clean, new tests pass, and
  a manual curl/browser check that `GET /api/sales/events` actually holds
  a connection open and receives at least one event after a real sale
  (this is the one piece worth confirming live rather than by code review
  alone, per this session's own standard for "did I just build something
  that looks right but never fires").

**Phase 2 - Frontend event client (also invisible - no screen wired yet).**

- Decision needed from you first: install `@microsoft/fetch-event-source`
  (recommended, keeps the JWT out of the URL) or accept a `?token=`
  query-param `EventSource` connection (zero new dependency, simpler, but
  puts the token somewhere it can end up in a server access log). I'd
  rather get an explicit yes on the new dependency than assume it.
- `SalesEventsService`: opens the connection, exposes events plus the
  `reconnected` signal described above.
- **Verification gate:** a throwaway console.log subscription proving
  events actually arrive client-side before any screen depends on them.

**Phase 3 - Wire the three consuming screens.**

- `Register`, `Dashboard`, `Reports` each inject `SalesEventsService`,
  filter to the branch(es) they care about, and call their own existing
  load method on event or reconnect - no new data-shape code in any of the
  three.
- This is the first phase where behavior visibly changes, so it's also
  where the code-review pass (`/code-review`, per this session's pattern)
  makes the most sense - after this phase, not each smaller phase.

**Phase 4 - QA pass.**

- Work through the 8 scenarios above. Note: scenarios 1, 2, 7, and 8
  need two genuinely different logged-in sessions at once (e.g. Owner in
  one tab, Employee in another) - this app's `chardworkz.auth` key is
  shared per browser origin, so two tabs in the _same_ browser profile
  share one session. Two different sessions need either two separate
  browser profiles/an incognito window, or you and me each driving one
  side - flagging this now since it's a real logistics constraint, not
  something to discover mid-QA.

**What I need from you before starting Phase 1:** confirmation to proceed
at all, and the fetch-event-source dependency decision from Phase 2 (fine
to decide that one later, right before Phase 2 starts, if you'd rather not
front-load it).
