---
title: "ChardWorkz — Mobile-Native Layout Plan"
type: documentation
status: active
created: 2026-09-17
updated: 2026-09-17
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Mobile-Native Layout Plan

Scope: platform-layer mobile fixes (viewport, touch, safe area — the `mobile-native` skill) applied this session, plus a layout plan for the one real structural gap they don't cover: the app shell itself is a desktop sidebar-dock + browser-tab-strip pattern at every breakpoint, never collapsed for phone widths.

## 1. What was already in place (DEC-046, 2026-09-16)

- Global tap-highlight removal, `touch-action: manipulation`, 16px input font under 767px, `prefers-reduced-motion` guard, a Tailwind `hover:` variant gated to `(hover: hover)`.
- Per-page content is already genuinely responsive: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (Register's product grid), `grid-cols-1 lg:grid-cols-[2fr_1fr]` (Register's list/cart split), `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (Reports), Products/Inventory pagination. No raw `<table>` anywhere in the app (confirmed via grep) — everything is card/flex-based, which is the harder mobile problem already solved.

## 2. Fixes applied this session

| File                                               | Change                                                                                                                                                                                                                       | Why                                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/index.html`                          | `viewport-fit=cover`, `interactive-widget=resizes-content`, single `theme-color` + `color-scheme` meta                                                                                                                       | Lets fixed UI pad around the notch/home-indicator; keeps the Android keyboard from leaving `100dvh` layouts stuck at the wrong height                                                       |
| `frontend/src/app/core/theme.ts`                   | `apply()` now also updates the `theme-color` meta tag's `content`                                                                                                                                                            | This app's dark mode is a manual class toggle, not OS `prefers-color-scheme` — a media-query-gated tag would drift from what's actually on screen                                           |
| `frontend/src/styles.css`                          | `-webkit-text-size-adjust: 100%`; `overscroll-behavior: none` on `html,body`; `user-select: none` + `-webkit-touch-callout: none` on `button`/`a`/`[role=button]` (not inputs)                                               | No landscape font inflation; stops pull-to-refresh/rubber-band hijacking the page since this app has its own scroll containers everywhere; no long-press text-selection callout on controls |
| `frontend/tailwind.config.js`                      | `hover:` variant now also requires `(pointer: fine)`                                                                                                                                                                         | Some Android touch devices report `hover: hover` without a precise pointer; closes that gap                                                                                                 |
| `frontend/src/app/layout/layout/layout.html`       | Shell root `h-screen` → `h-dvh`; tab strip gets `touch-action: pan-x`                                                                                                                                                        | `100vh` overflows by the URL bar's height on load; the horizontally-scrolling tab strip should own horizontal pans without fighting vertical page scroll                                    |
| `frontend/src/app/register/register/register.html` | Toast `bottom-4` → `bottom-[calc(1rem+env(safe-area-inset-bottom))]`; Recent Transactions drawer's scroll area gets the same bottom calc + `overscroll-contain`; product list and cart scroll areas get `overscroll-contain` | The toast and drawer are genuinely edge-pinned; the product list/cart are independent scroll containers that shouldn't hand off to page-level overscroll                                    |

Compiled clean (`tsc --noEmit`), hot-reloaded with no errors, and spot-checked live: shell renders correctly, dark-mode toggle correctly flips the `theme-color` meta tag between `#F5F5F5`/`#0f172a`.

**Deliberately not touched:** the Register/Reports receipt modals' button rows — they're centered with existing `p-4` viewport padding, not glued to an edge, so there's no concrete "why" yet (Hard Rule 1). Revisit if real-device testing shows otherwise.

## 3. The real gap: the shell doesn't adapt to phone width

`Layout` (`layout/layout/layout.html`) is one fixed structure at every breakpoint:

- A **left icon-rail dock** (`w-16`, floating, rounded) — Dashboard/Register/Products/Inventory/Reports/Roles/Activity Log/Settings + theme/help/logout.
- A **header** with a browser-style horizontally-scrolling **workspace tab strip** (one tab per visited route, closable) plus notifications/user menu.

This is a deliberate desktop metaphor (see `docs/frontend-design-conventions.md`'s revision history — modeled on a browser-tabs reference image) and it's never collapsed. On a 375–428px phone, that's a 64px fixed icon column plus a multi-element header (logo, tab strip, settings/notification/user-menu icons) all competing for width at once — cramped at best, and the tab-strip metaphor itself ("browser tabs" for a single-purpose POS/admin screen) doesn't map to how anyone actually uses a phone.

### Proposed phone-breakpoint layout (`<640px` / Tailwind `sm`)

Reuse existing data, no new model:

1. **Replace the left icon dock with a bottom tab bar** below `sm`. Same `navItems` array (`Layout.navItems`, already role-filtered) rendered as a fixed, safe-area-bottom-padded bar (`fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)]`, `grid grid-cols-{navItems.length}`, icon + short label). This is the single highest-value change — it's the standard mobile-app pattern users already expect, and this app's own nav data already exists in exactly the shape needed.
2. **Drop the tab strip below `sm`.** A phone user doesn't need multiple "workspace tabs" open — `openTabs`/`closeTab` stay for desktop; on phone, the header collapses to just the current page title (from route `data.title`, already read in `ngOnInit`) plus the notification bell and user menu.
3. **Simplify the header row itself** below `sm`: drop the `ChardWorkz` wordmark (already `hidden sm:inline`, so this is consistent with existing behavior) and rely on the current-page title instead of tabs for orientation.
4. **`main`'s bottom padding** needs to grow to clear the new bottom bar (`pb-20` or similar) so content doesn't render underneath it, plus the bottom bar itself needs `safe-bottom` treatment for the home-indicator gesture area.

This is layout/UX work, not a platform-layer fix — it needs your sign-off on the pattern (bottom tab bar is the recommendation, but confirm before it's built) and is sized as its own phase, not a same-session addition. Flagged in `backlog.md`.

## 4. Suggestions & recommendations, prioritized

1. **Scope and build the bottom-tab-bar shell (§3)** — the actual structural fix. Everything else here is secondary to this.
2. **Real-device pass** on the fixes already applied (see §5) — none of them reproduce correctly in desktop emulation, per the skill's own Hard Rule 5.
3. **Extend the same overscroll/safe-area treatment** to any future fixed drawer/sheet the app adds — the pattern is now established in Register; don't let the next one skip it.
4. **Re-check the receipt modals on a real short-viewport phone** (§2's "deliberately not touched" item) — if the card ever gets tall enough to push the button row near the bottom edge in practice, revisit then with a concrete case in hand.
5. **If ChardWorkz is ever installed as a PWA** (added to home screen), safe-area-top/left/right become meaningful (no browser chrome to absorb them) — worth a manifest + revisit at that point, not now.

## 5. What needs a phone

Verifiable from code (done above): meta tags present, CSS rules compile and apply, dark-mode toggle syncs `theme-color`, no build errors.

**Cannot verify without real hardware** — the skill's own list, all of which apply here: sticky hover (now gated, but confirm no Android device still shows it), the tap-highlight removal, `100dvh` actually tracking the URL bar as it collapses/expands on scroll, input font-size actually preventing iOS zoom, `overscroll-behavior: contain` actually stopping rubber-band handoff from the drawer/cart/product-list, and safe-area padding actually landing correctly on a notched device. Connect a phone (USB + LAN IP, or `chrome://inspect`/Safari Web Inspector) to confirm before calling this done.
