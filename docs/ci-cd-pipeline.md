---
title: "ChardWorkz — CI/CD Pipeline"
type: documentation
status: active
created: 2026-09-26
updated: 2026-09-26
ai_access: internal
ai_generated: true
review_status: draft
canonical: true
---

# CI/CD Pipeline

Target cloud architecture: **Vercel** (Angular frontend), **Railway** (Spring Boot backend + managed Postgres), **Cloudflare R2** (assets/CDN — see [[project_chardworkz_hosting_stack]]), **GitHub** (source + Actions).

Repo: `kaotikus27/ChardWorkz`, private, personal (non-org) GitHub account, single maintainer (no other collaborators). **This is the one true source** for branch protection rules, environments, and secrets — everything in Phase 1 below lives here only.

### Code mirror

`EHalaman/Chardworkz---Racing-Team-and-Powder-Coating` (also owned by the same person, Eleomar Halaman, under his real-name account) was added as a second git remote (`git remote add ehalaman <url>`) and force-pushed with `main`/`development`/`staging` on 2026-09-26, to have the code backed up under that account too. It is a **plain code mirror only** — no branch protection, no environments, no secrets, no CI configured there, by deliberate choice. Don't assume parity with `origin` when working from that remote; if it's ever promoted to a real second deploy target, Phase 1's GitHub setup needs to be redone there from scratch. Pushing to it goes through the local `ehalaman` remote and requires the user's own EHalaman GitHub credentials (git push from an agent session gets blocked by Claude Code's own data-exfiltration classifier — the user has to run that push themselves).

## Phase 1 — Branching & GitHub Setup (done 2026-09-26)

### Branch model

Started from a single `main` branch with no CI, no Dockerfile, no Railway/Vercel config. Adopted a **3-branch model** (a 4th `prod-testing` branch was considered and rejected — its safety purpose is better served by a Flyway dry-run CI job against an ephemeral Postgres container on every PR into `main`, planned for Phase 3, so it never has to become a real merge target):

| Branch        | Purpose                                               | Deploys to                                          |
| ------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `development` | Feature integration, local/dev testing                | Nothing auto-deployed yet                           |
| `staging`     | Release-candidate testing, UAT, staging DB validation | Vercel Staging + Railway Staging DB (Phase 2)       |
| `main`        | Protected, live production                            | Vercel Production + Railway Production DB (Phase 2) |

Flow: feature branch → PR into `development` → PR into `staging` → PR into `main`.

`development` and `staging` were created from `main` and pushed to `origin` (`git branch development main && git branch staging main && git push -u origin development staging`).

### Branch protection rules

Classic branch protection rules were created for both `main` and `staging` via the GitHub web UI (`Settings > Branches`):

- **Require a pull request before merging**: on for both.
- **Require approvals**: deliberately left **off** (0) on both, not the more typical "≥1 approval." This repo has exactly one maintainer — requiring ≥1 approval combined with "do not allow bypassing" would make `main` permanently unmergeable, since GitHub never counts self-approval toward a required-review count and there is no second collaborator to approve. If a second collaborator is ever added, revisit this and set approvals back to 1.
- **Require status checks to pass before merging**: turned on as a placeholder with no specific check selected yet — no GitHub Actions workflow exists until Phase 3. Once the CI workflow is built, come back and select its actual job name here so it's genuinely required.
- **Allow force pushes** / **Allow deletions**: left at their default of off (disabled) on both branches.
- **Do not allow bypassing the above settings**: left off. Since there's no required-approval to bypass, this mostly matters once status checks are wired in — revisit alongside that.

**Known limitation — not currently enforced.** GitHub states directly in the UI: _"Your protected branch rules for your branch won't be enforced on this private repository until you move to a GitHub Team or Enterprise organization account."_ Both rules show **"Not enforced"** in `Settings > Branches`. They're configured now as documentation of intent and so they take effect automatically the moment the account is upgraded (or the repo made public), but today nothing stops a direct push to `main` or `staging`. This is a real, accepted gap for now — the maintainer chose to skip the paid upgrade rather than make the repo public. Revisit if/when upgrading to GitHub Pro (private repos) becomes worthwhile, or if a second collaborator joins (see [[project_chardworkz_secrets_rotation_pending]] for another security item already tracked for this project).

### GitHub Environments

Created via `Settings > Environments`:

- **`staging`** — left at default (no deployment-branch restriction). Will hold staging-scoped secrets in Phase 2 (Railway/Vercel/Cloudflare tokens, staging `DB_PASSWORD`/`JWT_SECRET`, etc.), kept separate from production's.
- **`production`** — **Deployment branches and tags** restricted to **"Selected branches and tags" → `main` only**. This means any GitHub Actions job referencing the `production` environment can only read its secrets when running on `main` — a real, currently-enforced guardrail (this feature is not gated by the paid-plan limitation above).
  - **Required reviewers (manual approval gate) is not available at all** on this plan/repo combination — not just unenforced, the option doesn't appear in the UI. The original plan (add yourself as a required reviewer on `production` to gate real deploys) can't be configured until either the repo goes public or the account upgrades to GitHub Pro. Treat `production`'s branch restriction (`main`-only) as the actual current gate, not a manual approval step.

## Open follow-ups from Phase 1

1. **Decide on GitHub Pro / public repo / status quo** — determines whether branch protection and required-reviewer approval gates become real. No decision made yet; current state is "configured but not enforced," accepted deliberately for now.
2. Once Phase 3's CI workflow exists, go back to both branch protection rules and select the real status-check job name(s) so "Require status checks to pass" actually gates something.
3. Phase 2 will populate `staging`/`production` environment secrets — do not put real credentials in repo-level secrets; scope them to the correct environment.

## Phase 2 — Vercel (frontend), started 2026-09-26

**Cloud cost guardrail**: see the project root `CLAUDE.md` — check current usage against free-tier limits before any Vercel/Railway/Cloudflare provisioning or production action. Railway specifically has no indefinite free tier (one-time trial credit only); Vercel Hobby and Cloudflare R2's free tiers are indefinite within usage limits.

### Frontend fixes required before any deploy could work

- **The default `production` Angular build was already broken**, independent of anything else — bundle (1.03MB) exceeded the hard error budget (1MB), so `ng build --configuration=production` produced no output at all. Never caught locally since `ng serve` uses the unbudgeted `development` config. Fixed by raising `angular.json`'s `production` and new `staging` budgets to 1MB warning / 1.5MB error (headroom over actual size, not a bundle-size optimization — that's separate, unstarted work).
- Added a `staging` Angular build configuration + `environment.staging.ts` (mirrors `environment.ts`/production but with its own `apiBaseUrl` placeholder), since the frontend's `apiBaseUrl` is empty in production (same-origin assumption) — Vercel (frontend) and Railway (backend) will be on different domains, and the backend already supports CORS cross-origin (`CORS_ALLOWED_ORIGIN`, DEC-026), so real Railway URLs will replace both `REPLACE_WITH_RAILWAY_PRODUCTION_URL` (`environment.ts`) and `REPLACE_WITH_RAILWAY_STAGING_URL` (`environment.staging.ts`) once Railway exists.
- Added `frontend/vercel.json`: branch-aware `buildCommand` (`staging` branch → `ng build --configuration=staging`, else production), `outputDirectory: dist/frontend/browser`, `ignoreCommand` (only `main`/`staging` actually build — `development` pushes don't consume build minutes), and a SPA fallback `rewrite` (`/(.*) → /index.html`) so Angular Router deep links don't 404.
- All committed to `origin` as `5c4d183`. This commit is **not** yet in `development`/`staging` (only `main`) — merge forward when convenient.

### Vercel project

- Vercel account (`eleomar-halamans-projects-fb608c77`, Hobby plan) only has EHalaman's GitHub connected, not kaotikus27's. Rather than cross-connect accounts, the user chose to **deploy from the `ehalaman` mirror repo's `main` branch directly** — accepting that Vercel will only ever see code that's been manually re-mirrored there (see the Code Mirror section above). This is a real ongoing operational cost: **every future change to `origin/main` that should reach production must be manually re-pushed to `ehalaman` before Vercel will pick it up.**
- Project created: `chardworkz`, Root Directory `frontend`, Angular preset, Build/Output/Install commands left on their `vercel.json`-deferred defaults.
- **Two real blockers hit and fixed during first deploy:**
  1. First deploy attempt ran against a stale mirror (pushed before the budget/`vercel.json` fix existed) — failed with the old 600kB/1MB budget error. Fixed by re-force-pushing the mirror with the real fix included.
  2. Second attempt failed differently: **"Deployment Blocked — the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories."** All ChardWorkz commits are authored as `kaotikus27`; the Vercel Hobby account is EHalaman's. Fixed in two steps — made the `ehalaman` mirror repo public (GitHub `Settings > Danger Zone > Change visibility`), **and** amended the deploy commit's author to EHalaman's own GitHub noreply email (`git commit --amend --author="EHalaman <...>" --no-edit`) before force-pushing again. Both changes landed together; which one actually cleared the block wasn't isolated, but the author-identity fix is the one to repeat going forward — **every commit pushed to `ehalaman` that should deploy needs to be authored as EHalaman, not kaotikus27**, or Vercel will block it again regardless of repo visibility.
  3. This author-amend only happened on the local branch tip transiently — local `main` was reset back to `origin/main`'s original (kaotikus27-authored) commit afterward so normal `origin` work isn't affected. The EHalaman-authored commit only exists on the `ehalaman` remote.
- **First successful deploy**: commit `eb8ff3d` (EHalaman-authored equivalent of `origin`'s `5c4d183`), live at **chardworkz.vercel.app** — verified loading the real homepage content.
- No `staging` Vercel deployment/domain set up yet — only `main` → production has been exercised so far.

## Roadmap (not yet built)

- **Phase 2 (remaining)** — Railway Postgres (staging vs. production instances), Spring Boot env vars/Flyway/connection pooling on Railway, then backfill real Railway URLs into `environment.ts`/`environment.staging.ts`; Cloudflare DNS/SSL/R2 buckets (no custom domain yet — using provider default subdomains for now, per user decision 2026-09-26).
- **Phase 3 — CI workflows**: GitHub Actions running `mvn test` and `ng build` on every PR; a Flyway dry-run against an ephemeral Postgres container on PRs into `main` (replaces the rejected `prod-testing` branch's safety purpose).
- **Phase 4 — Safety guardrails**: zero-downtime deploy pattern, migration safety checks, secrets-handling conventions.

Separately, and not part of this pipeline: before `main` ever deploys to _real_ production, `05 -Skills/production-security-checklist.md` must be walked per the vault's `CLAUDE.md` §6 (already an open item in `handoff.md`).
