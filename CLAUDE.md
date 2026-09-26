# ChardWorkz — Project Rules

## Cloud cost guardrail (check before any production/deployment action)

This project's hosting stack is Vercel (frontend) + Railway (backend + Postgres) + Cloudflare (R2/DNS) — see `docs/ci-cd-pipeline.md` and `DECISIONS.md` DEC-054.

**Before provisioning, scaling, or configuring anything on Vercel, Railway, or Cloudflare — especially anything touching the production environment — check current usage against the account's plan/free-tier limits first.** If an action would exceed free-tier limits or require an upgrade/paid plan, stop and ask the user before proceeding. Never assume an upgrade is wanted.

Known facts about these three providers' free tiers (verify against the live account/dashboard before relying on this — pricing changes):

- **Vercel Hobby**: genuinely free indefinitely within its usage limits (deployments, bandwidth, serverless execution, etc.) — no forced expiry.
- **Cloudflare R2**: genuinely free indefinitely within its usage limits (storage, Class A/B operations per month) — no forced expiry.
- **Railway**: does **not** have an indefinite free tier. New accounts get a one-time trial credit (historically ~$5), after which continued usage requires a paid Hobby plan (historically ~$5/month minimum) once the trial credit is exhausted. "Stay on Railway's free tier forever" is not actually achievable under their current pricing — the real goal is minimizing usage/cost on the smallest viable paid plan, not avoiding payment entirely. Flag this tradeoff explicitly whenever Railway costs come up, rather than silently assuming a free option exists.
