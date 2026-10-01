---
title: Railway Singapore region migration plan
type: plan
status: cancelled-2026-10-01-user-decision-stay-in-current-region
created: 2026-10-01
updated: 2026-10-01
ai_generated: true
---

# Railway: move backend + Postgres from sfo to Singapore

**Status: PLAN ONLY. Nothing has been changed on Railway.** Per the project cloud-cost guardrail (CLAUDE.md), every step below that provisions, moves or resizes a service needs the user's explicit go-ahead first.

## Why

- Measured 2026-10-01: a trivial request to the production backend took about 0.7 s time-to-first-byte (a 401 reject, so no real work). Locally the same request is 1-4 ms.
- Production dashboard calls took 0.7-3.0 s; the same calls on a local backend took 23-167 ms with comparable data (232 products, no sales this month). The queries are not the bottleneck.
- `backend` and `Postgres` are both in `sfo` (San Francisco), 1 replica each. Users are in the Philippines.
- The frontend is a static SPA on Vercel (`vercel.json` only rewrites to `/index.html`). The browser calls the Railway backend directly, so Railway's region is the user-facing latency.

## Update 2026-10-01 (later): confirmed facts, and recommendation

- **Confirmed by the user:** the team and all users are in the Philippines, so Singapore is the right region if a move happens.
- **Railway credit:** the dashboard showed 25 days or $3.14 left. Running two sets of services during the overlap week likely needs a paid plan first.
- **No backups exist:** built-in backups are Pro-plan only, and the volume has none. A `pg_dump` was taken on 2026-10-01 (outside the repo, in `~/chardworkz-backups`); it has not been test-restored (needs a Postgres 18 target).
- **Plan limits seen:** 2 vCPU / 1 GB RAM per replica; Postgres and backend both in US West (California).
- **Recommendation:** do not migrate yet. First merge the repeated dashboard calls, then decide on a paid plan, and only move if the site still feels slow. Nothing in this plan has been executed.

## Why Singapore (and not "the Philippines")

- Railway has no Philippines region. Its regions are US West (California), US East (Virginia), EU West (Amsterdam) and Southeast Asia (Singapore) - confirm the current list in the dashboard.
- Singapore is the nearest to the Philippines. Rough round-trip: Philippines to San Francisco about 180-220 ms, to Singapore about 40-70 ms. A TLS connection costs several round trips, so this compounds.
- This is unrelated to VPN. It is just physical distance; a VPN would not help and would normally add latency.

## Expected gain, and its limit

- Removes most of the roughly 0.7 s fixed cost per request.
- Does NOT fix server-side slowness: dashboard calls were 1-2 s slower in prod than local even after subtracting distance. That points at the container (CPU/JVM warm-up) and needs a separate check of Railway's Metrics tab. Do the move, then re-measure before deciding on a bigger instance.

## Open facts to verify in the Railway dashboard before starting

1. Current plan (trial credit vs Hobby) and remaining credit - the CLI does not expose this.
2. Whether the service Settings page offers a Region selector for the `Postgres` volume service, or whether volumes can only be recreated. Railway has supported moving a service between regions, but a volume-backed Postgres may need a dump/restore - confirm in the UI, do not assume.
3. Any egress/cost difference for the Singapore region.

## Steps (when approved)

0. **Backup first (no cost, no risk):** `pg_dump` the production DB over the public TCP proxy (see the Railway CLI note: SSH tunnel is blocked, use the public proxy). Verify the dump restores into the local `chardworkz` PostgreSQL 17.
1. **Cost check:** confirm plan and remaining credit; get approval if the move needs a paid plan or extra spend.
2. **Create new Singapore Postgres** service (new service, so rollback stays trivial; the old one keeps running).
3. **Restore the dump** into it; compare row counts per table against the source.
4. **Deploy a second backend service in Singapore**, pointing its `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` references at the new Postgres (variable references, not copied literals). Reuse the same `JWT_SECRET` so existing logins stay valid; set `CORS_ALLOWED_ORIGIN=https://chardworkz.vercel.app`.
5. **Smoke test** the new backend directly: health, login as Owner by a human (agent never types passwords), dashboard, a read-only register flow.
6. **Cutover window (short, low-traffic):** stop writes on the old backend, take a final incremental dump/restore, then switch the frontend `apiUrl` in `environment.production.ts` to the new backend domain and deploy. Note the push-to-main path currently bypasses PR rules; prefer the PR route for this change.
7. **Verify** with the same timing probe used on 2026-10-01 (curl TTFB + dashboard `performance` entries).
8. **Keep the old sfo services for ~1 week** as rollback, then delete them (deletion needs separate approval; it frees credit).

## Rollback

Re-point the frontend `apiUrl` back to the sfo backend and redeploy. Because the old sfo services are untouched until step 8, rollback needs no data work as long as no writes occurred only on Singapore after cutover; if they did, dump Singapore and restore into sfo first.

## Risks

- Data written between the final dump and the cutover is lost unless writes are frozen (step 6) - hence the quiet window.
- Different public domain for the new backend means CORS, any hard-coded URLs and the SSE/event-stream client must be updated together.
- Reset of long-lived sessions is not expected if `JWT_SECRET` is reused.
- Trial credit may run out faster with two sets of services running during the overlap week.

## Related

- Hosting stack and Railway notes: DEC-054, DEC-080, `docs/ci-cd-pipeline.md`.
- Dashboard design (in-memory aggregation, repeated lookups across summary/analytics/alerts): DEC-033.
