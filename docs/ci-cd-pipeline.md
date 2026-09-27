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

**Cloud cost guardrail**: see the project root `CLAUDE.md` — check current usage against free-tier limits before any Vercel/Railway/Cloudflare provisioning or production action. Railway specifically has no indefinite free tier (one-time trial credit only); Vercel Hobby and Cloudflare R2's free tiers are indefinite within usage limits.

## Canonical repo (as of 2026-09-26)

**`EHalaman/Chardworkz---Racing-Team-and-Powder-Coating`** (public, personal GitHub account, real name — same person, Eleomar Halaman) is the **one true source** for development and deployment going forward: branch protection rules, GitHub Environments, secrets, and the Vercel/Railway/Cloudflare integrations all live here.

**`kaotikus27/ChardWorkz`** (private, the original repo, all of this project's real history) is now a **backup/historical mirror only** — not touched for active work. Local git remotes reflect this: `origin` points at the EHalaman repo, `kaotikus27-legacy` points at the old one.

This wasn't the original design — the project started entirely on `kaotikus27/ChardWorkz`, and EHalaman's repo was added midway through this session purely as a Vercel deploy target (since the Vercel account is under EHalaman). That two-repo split caused real friction (constant git-credential switching between accounts, a stale-mirror deploy failure, and a Vercel Hobby-plan block on non-owner-authored commits — see below). The user explicitly decided to consolidate onto EHalaman rather than keep patching around the split.

**Local git identity for this repo** (`git config --local user.name`/`user.email` inside `ChardWorkz/`) is now set to `EHalaman <170899443+EHalaman@users.noreply.github.com>`, not `kaotikus27`. This matters concretely: Vercel's Hobby plan blocks deploying any commit whose author isn't the account owner on a repo without collaboration support — the fix (below) was making this repo public _and_ correcting the commit author; going forward, every commit needs to be authored as EHalaman or Vercel deploys will block again regardless of visibility.

**Pushing to GitHub from an agent session gets blocked by Claude Code's own data-exfiltration classifier** the first time a given remote is pushed to in a session — the user has to run that specific `git push` themselves (via the `!` prefix). Combined with Windows Git Credential Manager caching one GitHub login at a time, switching between the two accounts required repeatedly clearing the cached credential (`printf "protocol=https\nhost=github.com\n\n" | git credential-manager erase`) before each push as a different account. This friction is exactly why consolidating onto one account/repo was worth doing.

## Phase 1 — Branching & GitHub Setup

Done on `kaotikus27/ChardWorkz` on 2026-09-26, then **redone identically on `EHalaman/Chardworkz---Racing-Team-and-Powder-Coating`** the same day once the canonical repo changed. Both repos currently have the same Phase 1 setup, but only EHalaman's is live/actionable going forward — kaotikus27's is a frozen historical snapshot.

### Branch model

Started from a single `main` branch with no CI, no Dockerfile, no Railway/Vercel config. Adopted a **3-branch model** (a 4th `prod-testing` branch was considered and rejected — its safety purpose is better served by a Flyway dry-run CI job against an ephemeral Postgres container on every PR into `main`, planned for Phase 3, so it never has to become a real merge target):

| Branch        | Purpose                                               | Deploys to                                          |
| ------------- | ----------------------------------------------------- | --------------------------------------------------- |
| `development` | Feature integration, local/dev testing                | Nothing auto-deployed yet                           |
| `staging`     | Release-candidate testing, UAT, staging DB validation | Vercel Staging + Railway Staging DB (Phase 2)       |
| `main`        | Protected, live production                            | Vercel Production + Railway Production DB (Phase 2) |

Flow: feature branch → PR into `development` → PR into `staging` → PR into `main`.

### Branch protection rules

Classic branch protection rules on both `main` and `staging` (`Settings > Branches`):

- **Require a pull request before merging**: on for both.
- **Require approvals**: deliberately left **off** (0) on both, not the more typical "≥1 approval." This repo has exactly one maintainer — requiring ≥1 approval would make `main` permanently unmergeable, since GitHub never counts self-approval toward a required-review count and there is no second collaborator to approve. If a second collaborator is ever added, revisit this and set approvals back to 1.
- **Require status checks to pass before merging**: turned on as a placeholder with no specific check selected yet — no GitHub Actions workflow exists until Phase 3. Once the CI workflow is built, come back and select its actual job name here so it's genuinely required.
- **Allow force pushes** / **Allow deletions**: left at their default of off (disabled) on both branches.
- **Do not allow bypassing the above settings**: left off. Since there's no required-approval to bypass, this mostly matters once status checks are wired in — revisit alongside that.

**These rules are genuinely enforced on the EHalaman repo** (GitHub Free enforces classic branch protection on public repos) — unlike the earlier kaotikus27 setup, which showed "Not enforced" because GitHub Free doesn't enforce branch protection on _private_ repos without a paid Team/Enterprise upgrade. Going public rather than paying for that upgrade is the reason this now actually works.

### GitHub Environments

- **`staging`** — left at default (no required reviewers, no branch restriction). Will hold staging-scoped secrets in Phase 2 (Railway/Vercel/Cloudflare tokens, staging `DB_PASSWORD`/`JWT_SECRET`, etc.), kept separate from production's.
- **`Production`** — note the capital P: this one was **auto-created by Vercel's own GitHub Deployments integration** the first time it deployed, not created manually like the others. Configured with:
  - **Required reviewers: EHalaman** (self) — a genuine manual-approval gate. This _wasn't_ available at all on the earlier private-repo setup (the option didn't even appear in the UI); it's only offered because this repo is public.
  - **Deployment branches and tags** restricted to `main` only.
  - **Important nuance**: these protection rules only apply to **GitHub Actions workflows** that reference this environment via `environment:` in a workflow file. They do **not** gate Vercel's own deploys — Vercel deploys through its own webhook/build integration, bypassing GitHub Actions entirely. Right now, nothing actually blocks a Vercel deploy on approval; this environment's rules become a real gate once Phase 3's CI workflows exist and reference `environment: production` themselves.

## Phase 2 — Vercel (frontend), started 2026-09-26

### Frontend fixes required before any deploy could work

- **The default `production` Angular build was already broken**, independent of anything else — bundle (1.03MB) exceeded the hard error budget (1MB), so `ng build --configuration=production` produced no output at all. Never caught locally since `ng serve` uses the unbudgeted `development` config. Fixed by raising `angular.json`'s `production` and new `staging` budgets to 1MB warning / 1.5MB error (headroom over actual size, not a bundle-size optimization — that's separate, unstarted work).
- Added a `staging` Angular build configuration + `environment.staging.ts` (mirrors `environment.ts`/production but with its own `apiBaseUrl` placeholder), since the frontend's `apiBaseUrl` is empty in production (same-origin assumption) — Vercel (frontend) and Railway (backend) will be on different domains, and the backend already supports CORS cross-origin (`CORS_ALLOWED_ORIGIN`, DEC-026), so real Railway URLs will replace both `REPLACE_WITH_RAILWAY_PRODUCTION_URL` (`environment.ts`) and `REPLACE_WITH_RAILWAY_STAGING_URL` (`environment.staging.ts`) once Railway exists.
- Added `frontend/vercel.json`: branch-aware `buildCommand` (`staging` branch → `ng build --configuration=staging`, else production), `outputDirectory: dist/frontend/browser`, `ignoreCommand` (only `main`/`staging` actually build — `development` pushes don't consume build minutes), and a SPA fallback `rewrite` (`/(.*) → /index.html`) so Angular Router deep links don't 404.

### Vercel project

- Vercel account (`eleomar-halamans-projects-fb608c77`, Hobby plan) is EHalaman's — which lined up naturally once EHalaman became the canonical repo.
- Project created: `chardworkz`, Root Directory `frontend`, Angular preset, Build/Output/Install commands left on their `vercel.json`-deferred defaults.
- **Real blockers hit and fixed while this was still a two-repo setup** (kept here for the record even though the repo split that caused them no longer exists): a stale-mirror deploy (old budget error, fixed by re-pushing with the real fix included), and a **"Deployment Blocked — the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories"** error — Vercel Hobby blocks deploying commits authored by anyone other than the account owner on a plan that doesn't support collaboration. Fixed by making the repo public and correcting the commit author to EHalaman. This is now permanently avoided by the local git identity change described above, not something to keep working around.
- **Live**: **chardworkz.vercel.app** — verified loading the real homepage content.
- No `staging` Vercel deployment/domain set up yet — only `main` → production has been exercised so far.

## Open follow-ups

1. Once Phase 3's CI workflow exists, go back to both branch protection rules and select the real status-check job name(s) so "Require status checks to pass" actually gates something, and reference `environment: production`/`staging` in the workflow so the Environment-level protection rules (required reviewer, branch restriction) actually take effect on deploys.
2. Phase 2 will populate `staging`/`Production` environment secrets — do not put real credentials in repo-level secrets; scope them to the correct environment.
3. ~~Merge the Phase 1/2 commits from `main` forward into `development`/`staging`~~ — done 2026-09-27; both were plain fast-forwards (no divergent commits on either branch). Repeat this whenever `main` gets commits `development`/`staging` should also carry.

## Phase 2 — Cloudflare R2, started 2026-09-26

- **R2 subscription enabled** on the EHalaman Cloudflare account (`E.halaman11@gmail.com`) — genuinely $0/month within free-tier limits (10GB storage, 1M Class A ops, 10M Class B ops/month); a payment method is required on file for overage billing but nothing is charged unless those limits are exceeded.
- **A Budget Alert was set at $1** (`R2 Object Storage > Usage > Add Budget Alert`) as an early tripwire — emails `e.halaman11@gmail.com` if any billable usage appears at all, well before real money would be owed. Per the project's cloud cost guardrail (`CLAUDE.md`), check this before any bulk asset upload or usage-heavy R2 operation.
- **Bucket created**: `chardworkz-assets` — Standard storage class (required for free-tier coverage; Infrequent Access is billed separately and not free-tier eligible), Automatic location (placed in Asia Pacific), private/not publicly accessible.
- **API credentials generated**: an Account API Token (`chardworkz-assets-rw`, Object Read & Write, scoped strictly to the `chardworkz-assets` bucket only — not account-wide, TTL "Forever"). The resulting S3-compatible `Access Key ID`/`Secret Access Key` were added as `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` to **both** the `staging` and `Production` GitHub Environment secrets on the EHalaman repo. The values themselves are not recorded anywhere (including here) — Cloudflare only shows them once at creation time; if lost, revoke the token and generate a new one.
- The R2 S3-compatible endpoint is `https://<account-id>.r2.cloudflarestorage.com` (account-specific, not secret) — not yet wired into the backend since no R2 integration code exists yet.
- No backend code uses these credentials yet — this is provisioning ahead of the actual integration, at the user's explicit request. When that integration is built, it consumes `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/the endpoint via the GitHub Environment secrets already in place, plus Railway env vars for runtime (not yet configured — see Roadmap).

## Phase 2 — Railway (backend + Postgres), 2026-09-27

- **Project**: `chardworkz` on Railway (trial plan — 30 days or $5.00 credit, whichever comes first; no indefinite free tier, per `CLAUDE.md`'s cost guardrail). Two environments: `production` (Railway's default) and `staging` (created manually).
- **Postgres**: one instance per environment, each its own independent service (not a duplicated/shared environment) — `Postgres` in `production`, `Postgres-CHau` in `staging` (Railway auto-suffixed the name since a plain rename to `Postgres` collides — service names are unique per-project, not per-environment).
- **Backend service**: deployed from the EHalaman GitHub repo, Root Directory `/backend`, Railpack builder (auto-detected `java@21.0.2`). `production` service (named `backend`) tracks the `main` branch; `staging` service (named `backend-staging`) tracks the `staging` branch — both auto-deploy on push.
- **Env vars** (Service Variables, not repo secrets): `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` set as Railway variable references (`${{Postgres.PGHOST}}` etc., or `${{Postgres-CHau.*}}` in staging) rather than copied literal values, so they stay in sync automatically if the DB service's credentials ever rotate. `JWT_SECRET` generated fresh per environment (64-char random, well over the app's 32-byte minimum) and pasted directly into Railway — never echoed to chat or committed anywhere. `CORS_ALLOWED_ORIGIN` set to `https://chardworkz.vercel.app` on `production`; left unset on `staging` since no staging Vercel deployment exists yet (see Open follow-ups). `BOOTSTRAP_OWNER_USERNAME`/`BOOTSTRAP_OWNER_PASSWORD` deliberately left unset on both — the app boots fine without them (just logs a warning, creates no account per `BootstrapAccountRunner`); set them intentionally later if/when a real admin login is needed.
- **Flyway / connection pooling**: no extra config needed — the existing `spring.datasource.*` properties and the `flyway` Maven dependency pick up the same Railway-provided connection automatically, and both deployments came up `ACTIVE` with Hibernate's `ddl-auto=validate` passing (a schema mismatch would have failed the boot), confirming Flyway ran cleanly against both fresh databases.
- **Public networking**: generated a Railway subdomain for each backend, port 8080 — `backend-production-d51a.up.railway.app` and `backend-staging-staging-a4b4.up.railway.app`. Both verified live via `curl` (clean `{"error":"Unauthorized"}` JSON from the app's own exception handler, not a Railway platform error — confirms the app fully booted, not just that the container started).
- **GitHub App**: Railway's GitHub App needed a one-time authorization against the EHalaman account/repo before it could see any repos to deploy from.
- Real Railway URLs backfilled into `frontend/src/environments/environment.ts` (`REPLACE_WITH_RAILWAY_PRODUCTION_URL` → the production URL above) and `environment.staging.ts` (same for staging), committed on `main` and merged forward.

## Roadmap (not yet built)

- **Cloudflare DNS/SSL** — no custom domain yet, using provider default subdomains for now (Vercel's and Railway's), per user decision 2026-09-26.
- Actual backend R2 integration code (bucket is provisioned, nothing reads/writes to it yet).
- A staging Vercel deployment/domain, so `staging`'s `CORS_ALLOWED_ORIGIN` can be set to a real origin instead of being left blank.
- **Phase 3 — CI workflows**: GitHub Actions running `mvn test` and `ng build` on every PR; a Flyway dry-run against an ephemeral Postgres container on PRs into `main` (replaces the rejected `prod-testing` branch's safety purpose).
- **Phase 4 — Safety guardrails**: zero-downtime deploy pattern, migration safety checks, secrets-handling conventions.

Separately, and not part of this pipeline: before `main` ever deploys to _real_ production, `05 -Skills/production-security-checklist.md` must be walked per the vault's `CLAUDE.md` §6 (already an open item in `handoff.md`).
