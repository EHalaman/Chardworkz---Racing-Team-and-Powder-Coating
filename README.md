# ChardWorkz — POS & Inventory System

A role-based Point of Sale and Inventory System for **ChardWorkz Racing Team and Powder Coating Services** — a real motorparts shop with two branches (main + Masinag) currently running sales and inventory entirely on paper.

**Status: planning stage.** No repository or code exists yet — this project lives entirely as vault documentation until Phase 0 scaffolding begins.

## Where the real content lives

- **`docs/project-initiation-draft.md`** — the canonical source of truth: scope, target architecture (Angular + Spring Boot + PostgreSQL, responsive across desktop/tablet/phone), reference schema, five Mermaid workflow diagrams, phased roadmap, and the 12 open questions that gate Phase 0.
- **`PROJECT-CONTEXT.md`** — objective, users, constraints, current phase, and which document wins when two disagree.
- **`memory.md`** — durable decisions and constraints, distilled for quick reference.
- **`DECISIONS.md`** — dated, individual decision log with consequences.
- **`handoff.md`** — current execution state and the immediate next action, for whoever picks this up next.
- **`backlog.md`** — the open questions (as a checklist) plus unscheduled Phase 0 scaffolding work.
- **`ChardWorkz_Thesis1_Summary.md`, `ChardWorkz_Thesis2_Summary.md`, `ChardWorkz_Thesis3_Summary.md`** — reference material only: three unrelated academic capstone theses used as design patterns, never as literal templates. See `RELATED DOCUMENTS/` for their original source files.

## Why three unrelated theses

None of the three source theses is ChardWorkz's actual spec. They're structurally similar prior work (POS/inventory systems, one with a public storefront, one with a service-booking module) mined for requirements, architecture patterns, and — just as usefully — documented mistakes to avoid (an insecure hashing inconsistency, FK schema drift, copy-pasted boilerplate from unrelated systems). `docs/project-initiation-draft.md` §0 has the full log of what was taken from where and what was deliberately rejected.

## Next step

Get the 12 open questions in `docs/project-initiation-draft.md` §5 answered by the business owner/manager (or their stated defaults explicitly accepted) — see `handoff.md` for the two that matter most right now.
