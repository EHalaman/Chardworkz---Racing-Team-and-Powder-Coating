---
title: "ChardWorkz — Frontend Design Conventions"
type: documentation
status: active
created: 2026-09-15
updated: 2026-09-15
ai_access: internal
ai_generated: true
review_status: draft
canonical: false
---

# Frontend Design Conventions

Reference for anyone (human or AI) building a new screen in `frontend/`.

**Nav chrome revision history:**

1. Labeled left sidebar, derived from `Refference_folder/image 97–102.png` ("VA To-Do").
2. Same-day, superseded by a top bar + icon-only rail, derived from `image 110.png` ("UVentra"), after the user replaced `Refference_folder/`'s contents.
3. Same-day, superseded again by the **current** shell: a floating rounded dock + closable browser-style workspace tabs, per a user-supplied migration spec (table + execution plan pasted directly, not a screenshot). See `DECISIONS.md` DEC-017.

Color palette was never changed from the original ChardWorkz spec across all three revisions — only structure, typography, and interaction patterns changed.

## Color palette (`tailwind.config.js`)

| Token       | Hex       | Use                                                                                           |
| ----------- | --------- | --------------------------------------------------------------------------------------------- |
| `nav-bg`    | `#F5F5F5` | Page canvas background (behind the floating dock and content cards)                           |
| `surface`   | `#FFFFFF` | Dock, top bar, and card backgrounds                                                           |
| `primary`   | `#3FA485` | Primary actions/buttons, active-nav highlight, positive trend indicators                      |
| `secondary` | `#E2B24A` | Secondary/warning — used for "expiring soon" / "low stock" alert rows                         |
| `danger`    | `#E87351` | Danger/cancel — used for "out of stock" alerts, negative trend indicators, logout hover state |

Each of `primary`/`secondary`/`danger` also has a `-hover` (darker) and `-light` (pale tint, badge backgrounds) shade — see `tailwind.config.js`. A migration doc (2026-09-15) proposed "electric blue" + a `#F4F6F9` canvas instead; the user explicitly kept the palette above ("Keep ChardWorkz palette") over that doc's colors.

**Dark mode** (added 2026-09-15, `darkMode: 'class'` in `tailwind.config.js`): toggled via `Layout.toggleTheme()`, which flips a `dark` class on `<html>` and persists the choice to `localStorage` (`chardworkz-theme` key, wrapped in try/catch). Brand accent colors (`primary`/`secondary`/`danger`) stay the same in dark mode; surfaces swap to Tailwind's `slate-800`/`slate-900`/`slate-700` scale via `dark:` variants — there are no separate custom dark tokens defined, just `dark:` utilities applied per-component. **Chart.js chart colors do not react to the theme toggle** (no dynamic re-theming wired up) — axis/grid colors were picked to be legible in both themes as a compromise, but this is a known gap if a chart is added later with colors that don't hold up in both modes.

## Typography

**Font:** Poppins (Google Fonts, loaded in `index.html`, configured as `theme.fontFamily.sans` in `tailwind.config.js` — Tailwind's Preflight applies it automatically via `font-sans`, no per-element class needed). Replaced the default system-font stack per the 2026-09-15 migration doc's "geometric typeface" requirement.

**Weight scale:**

| UI element                     | Weight          | Tailwind class  |
| ------------------------------ | --------------- | --------------- |
| Page title & primary metrics   | Bold (700)      | `font-bold`     |
| Section headings & card titles | Semi-Bold (600) | `font-semibold` |
| Pills, badges & action buttons | Medium (500)    | `font-medium`   |
| Captions & axis labels         | Regular (400)   | `font-normal`   |

Follow this table for every new screen — don't default to whatever Tailwind's base heading style implies.

## Layout shell (`layout/layout/`)

- **Top bar** (`h-16`, `bg-surface`): brand mark + wordmark, then **closable workspace tabs** (`Layout.openTabs`) — browser-tab-style, opened dynamically as routes are visited (tracked via `Router` `NavigationEnd` + route `data.title`), each closable via an `✕` button that appears on hover (`group-hover`). Closing the active tab falls back to the previous tab in the list; the last remaining tab cannot be closed. Right-aligned cluster: a Settings shortcut (routes to `/settings`), a notification bell (visual placeholder, no backend), and the role/account dropdown.
- **Floating dock** (`w-16`, `rounded-3xl`, `shadow-lg`, `bg-surface`): detached from the screen edge (wrapped in a `flex items-center` column so it's vertically centered with margin, not stretched to `100vh`). Contains, top to bottom: role-filtered primary nav icons (`Layout.navItems`, unchanged filtering logic from earlier revisions), a divider, the dark/light theme toggle, a flex spacer, then Help and Log Out icons (both currently non-functional placeholders). Active nav item = filled `bg-primary` circle with a white icon.
- **Main content** (`bg-nav-bg` canvas, scrollable, `p-6`): individual screens are expected to render their own `.dashboard-card` (see below) elements on this canvas, not a single full-bleed white panel.

## Reusable card style

`.dashboard-card` (defined in `styles.css` via `@layer components`) = `rounded-3xl border border-gray-200 bg-surface p-6 shadow-sm` (+ `dark:` variants). Use this class on every card-shaped container instead of repeating the Tailwind utility list — this was an explicit ask from the 2026-09-15 migration doc ("Standardize Card Components").

## Role-based navigation

Nav items are filtered by role client-side (`Layout.navItems` getter, `ALL_NAV_ITEMS` array with a `roles: Role[]` per item — see `layout.ts`). **As of 2026-09-15 (`DECISIONS.md` DEC-027) this is real, not a scaffold**: `navItems` derives from `AuthService.currentUser()?.role` (the JWT's own role claim), replacing the earlier "Viewing as" dev-switcher entirely — there is no way to view the app as a role you aren't actually logged in as anymore. Current per-role nav, prioritized Owner-first (2026-09-15 decision):

- **Owner:** Dashboard, Products, Inventory, Sales Reports, Roles, Settings
- **Manager:** Dashboard, Register, Products, Inventory, Sales Reports, Settings
- **Employee:** Register only

This is a working assumption, not confirmed against the business owner — see `PROJECT-CONTEXT.md` Authorities §1. Giving Owner a "Roles" (create/manage role) tab expands Owner beyond `PROJECT-CONTEXT.md`'s original "read-only monitoring" description; flagged, not yet reconciled into that document. Note this filtering is still client-side/cosmetic only — there is no route-level role guard yet (`backlog.md`), so it hides nav items but doesn't block a direct URL hit by a mismatched role.

## Dashboard page content (`dashboard/dashboard/`)

Built 2026-09-15 per the migration doc's KPI/analytics requirements. **All data is hardcoded mock data in `dashboard.ts`** — no backend call exists yet; see the in-file comment. Contents: 3 KPI cards (value + trend %), a grouped bar chart ("Inventory Statistics": Stock In/Out/Value, monthly) and a doughnut-based radial gauge ("Sales Overview", % goal with center-overlay text) both via **Chart.js** (`ng2-charts`' `BaseChartDirective`, imported into `DashboardModule` — it's a standalone directive, importable into an NgModule's `imports` array directly), plus three list panels (Recent Activities, Alerts & Notifications, Top Product Recommendation). Product/activity data uses the actual ChardWorkz domain (motor parts, PHP currency) rather than the reference doc's generic furniture/shoe examples. `provideCharts(withDefaultRegisterables())` is registered in `AppModule` providers — required once, globally, for any chart anywhere in the app.

## Login (`auth/login/`)

Added 2026-09-15 (`DECISIONS.md` DEC-027) — a standalone route (`/login`) rendered _outside_ the shell (`app.html` is just `<router-outlet>`; every other route nests under a `Layout` parent route guarded by `core/auth-guard.ts`). Centered `.dashboard-card` form on the `nav-bg` canvas. Deliberately uses the native `(submit)` event with a manual `$event.preventDefault()` rather than Angular's `(ngSubmit)`, which requires `FormsModule` to actually work — using it without that module silently falls back to a native GET submission (a real bug hit and fixed this session, see DEC-027).

## Register (`register/register/`)

Added 2026-09-15 (`DECISIONS.md` DEC-027) — the first screen with real backend-driven content and the first to write data, not just read it. Two-column `.dashboard-card` layout (`lg:grid-cols-[2fr_1fr]`, stacks to one column below `lg` per Q11): a search-and-filter product list on the left (fetched once from `GET /api/products`, filtered client-side as the cashier types — deliberately not a per-keystroke API call, so search still works against a stale catalog during a network outage), a cart panel on the right (qty stepper, payment method buttons, optional reference field, Clear/Complete Sale). "Complete Sale" hands off to `OfflineSaleQueueService.enqueueSale` and resets immediately — no blocking wait on sync, per Q12. Stock counts shown are informational, not a hard cap — the UI doesn't block an oversell any more than the backend does (Q12 accepted risk).

Every other route (`Products`, `Inventory`, `Sales Reports`, `Roles`, `Settings`) still renders the generic `Placeholder` component, styled with `.dashboard-card` to match.
