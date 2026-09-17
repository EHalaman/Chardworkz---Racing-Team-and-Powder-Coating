---
title: "ChardWorkz — Motion & Micro-interaction Audit"
type: documentation
status: active
created: 2026-09-17
updated: 2026-09-17
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Motion & Micro-interaction Audit

Scope: mobile-native touch feel, fluid motion for modals/drawers/toasts, and
tactile feedback, following the Emil Kowalski checklist (no 300ms tap delay,
no sticky `:hover` on touch, no input-zoom, spring/ease-out over linear,
non-blocking floating toasts) plus an editorial/blueprint-viewer treatment
for the Raider R150 FI parts catalog. Findings are graded against the real
code as of this audit — see [[frontend-design-conventions]] for the app's
baseline conventions (plain signals, no ReactiveFormsModule, no framework
indirection).

No `@angular/animations` is installed and none was added — every fix below
is plain CSS (Tailwind keyframes/transitions + a delayed-unmount signal
pattern), matching this app's existing preference for direct code over
framework machinery.

## 1. Global infrastructure (done this session)

| File                          | Change                                                                                                                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/tailwind.config.js` | Spring/ease-out timing functions (`ease-spring`, `ease-out-expo`); keyframes + `animate-*` utilities for fade, slide-in/out-right, toast-in/out, pop-in/out, pin-pulse; a plugin that guards `hover:` behind `@media (hover: hover)` app-wide, with no template changes required. |
| `frontend/src/styles.css`     | `touch-action: manipulation` + transparent tap-highlight on every button/link/input; forces 16px font-size on inputs under 768px (stops iOS Safari's auto-zoom-on-focus); a `prefers-reduced-motion` block that collapses all animations/transitions to ~0.                       |

The 300ms tap-delay item from the brief is already moot: `index.html`'s
`<meta name="viewport" content="width=device-width, initial-scale=1">` is
sufficient on its own in evergreen mobile browsers (Chrome/Safari removed
the delay for viewports declared this way years ago). No further action
needed there.

## 2. Register & Recent Transactions drawer (done this session)

Previously: toast, drawer, and receipt modal all popped in/out instantly via
bare `*ngIf`, buttons had `hover:` only (no active/tap feedback), and the
drawer had no exit transition at all (that's not fixable with `*ngIf` alone
— the element is removed before a transition can play).

Fixed in `register.ts` / `register.html`:

- **Toast** — `animate-toast-in` / `animate-toast-out` (spring overshoot in,
  quick fade out), timed against the existing 3s auto-dismiss.
- **Drawer** — new `isDrawerMounted` signal keeps the panel in the DOM for
  220ms after close so `animate-slide-out-right` can finish; backdrop fades
  in step. `toggleDrawer()` now drives both.
- **Receipt modal** — same delayed-unmount trick, keyed off `activeReceipt`
  - a new `isReceiptClosing` flag; backdrop fade + `animate-pop-in`/`pop-out`
    on the card.
- **Tactile feedback** — `active:scale-95` (or `-90`/`-[0.97]`/`-[0.98]`
  depending on element size) added to every button in this component: product
  rows, cart qty +/−/remove, payment method pills, Clear/Complete Sale,
  transaction rows, drawer search-clear, receipt Close/Print.

The search bar (DEC-045) needed no changes — it was already a plain signal +
synchronous filter, which is correct at this app's data volume; adding a
debounce here would be new complexity with no payoff (already rejected once
for this exact box, see handoff DEC-045).

## 3. Prioritized backlog — not yet touched

Ranked by (user-visible impact) ÷ (effort). None of these were changed this
session — flagging for a follow-up pass, since rolling the same pattern
across ~6 more components in one shot wasn't confirmed in scope.

| Pri | Area                                                     | File(s)                                       | Issue                                                                                                                                                             | Fix pattern to reuse                                                                                                                    |
| --- | -------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Header dropdowns (bell, role menu)                       | `layout/layout.html`                          | Instant show/hide via `*ngIf`/class toggle, no tap feedback on the dock rail or tabs                                                                              | `animate-fade-in` + `scale-95→100` pop, same delayed-unmount trick if an exit animation is wanted; `active:scale-95` on rail items/tabs |
| P1  | Products: pagination, sort dropdown, Edit/Delete/Archive | `products/products/products.html`             | Page changes and dropdown open/close are instant; row action buttons have no tactile feedback                                                                     | Reuse toast/pop patterns; `active:scale-95` on all icon buttons                                                                         |
| P2  | Inventory: restock modal, per-branch cards               | `inventory/inventory/inventory.html`          | Same abrupt modal open/close as Register had                                                                                                                      | Reuse the mounted-flag + pop-in/out pattern verbatim                                                                                    |
| P2  | Activity Log: filters, table rows                        | `activity-log/activity-log/activity-log.html` | No transition on filter changes; already has a `trackBy` fix from DEC-043 but no motion                                                                           | Low priority — this is a dense data table, motion should stay minimal (row highlight fade only, not scale/spring)                       |
| P3  | Roles: permission toggle switches                        | `roles/roles/roles.html`                      | Binary on/off control with no animated thumb — the single best candidate in this app for a literal spring toggle, since it's a physical-feeling control by nature | A small dedicated toggle component (thumb `translate-x` + `ease-spring`), not a generic utility class                                   |

## 4. Interactive Raider FI Blueprint Viewer — net-new, not a refactor

Checked the real code before writing anything here (per this project's
standing rule of verifying external proposals against the actual app): there
is **no existing blueprint/showcase/hotspot feature** anywhere in
`frontend/src/app`. `ProductSummary` (`products/products.ts`) has no image
field, and no route, nav item, or backend endpoint serves a schematic or
per-part coordinates. The brief's "refactored... code" framing doesn't apply
— this had to be designed as a new, self-contained piece instead.

**Built:** `shared/blueprint-hotspot/` (`BlueprintHotspot`, declared +
exported from `SharedModule`) — a reusable exploded-schematic pin component.
Takes `imageUrl` + `hotspots: BlueprintHotspotPart[]` (id, name, brandTag,
unitPrice, `xPercent`/`yPercent` — percentage-based so pins stay correctly
placed at any rendered image size). Tapping a pin springs open a small
preview card (`animate-pop-in`, `ease-spring`) anchored above it; tapping the
same pin or the backdrop closes it. Pins pulse gently (`animate-pin-pulse`)
until opened. Zero new dependencies — plain signals, same as the rest of the
app.

**Deliberately not done**, because each is a real product decision, not a
styling choice:

- No route or nav entry — Owner/Manager/Employee visibility for a public-ish
  parts showcase hasn't been decided (compare `HIDDEN_GUARDED_ROUTES` in
  `layout.ts`, which exists specifically to avoid a route becoming open to
  every role by accident).
- No backend changes — `ProductSummary` still has no image column, and
  nothing stores per-part `(x, y)` schematic coordinates. Hardcoding demo
  hotspots against a placeholder schematic image would look done without
  being wired to anything real.
- Known scaffold limitation (documented in `blueprint-hotspot.css`): a pin
  within ~96px of the image's top/side edge can push its preview card
  outside the frame. Fine for a scaffold; needs edge-clamping math before
  this touches a real schematic image.

**Next step if this is wanted for real:** decide the data model (image
upload vs. static asset per FI part, hotspot coordinates authored how) and
the page/route/role visibility, then wire `BlueprintHotspot` into it — the
component itself is ready to consume real data today.

## 5. Verification performed

- `npx tsc -p tsconfig.app.json --noEmit` — clean, both before and after the
  new component.
- `npx ng build --configuration development` — clean AOT build, confirms the
  Tailwind plugin/keyframes compile and every template binding above
  type-checks against its component class.
- **Live-verified via `claude-in-chrome`** (2026-09-17, follow-up session):
  backend run on the `local` H2 profile (real Postgres wasn't up), a fresh
  Employee test account created to reach `/register` (Owner has no nav entry
  for it, per DEC-038). Added a real seeded part to cart, completed a sale —
  caught the toast and receipt modal mid-transition (visibly scaling/fading
  in, not popping instantly), confirmed the receipt closes with no leftover
  backdrop. Opened and closed the Recent Transactions drawer — slides in
  from the right with a fading backdrop, closes cleanly with no stuck
  overlay. No console errors. Tactile `active:scale-*` feedback wasn't
  independently confirmed (static screenshots can't capture a mid-tap
  transform), but every animated open/close path was exercised live and
  behaved correctly.
