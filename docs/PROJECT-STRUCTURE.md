# Project structure

How the Sodak-Tech repository is organised after consolidating the Lovable UI
build into the main tree.

---

## Top level

```
SODAK_Solve/
├── backend/          Django + DRF API — single source of truth
├── frontend/         TanStack Start app (Lovable / Stitch UI)
├── docs/             Specification, build order, runbooks
├── design/           Figma export reference (predates light theme)
├── reference/        Archived prototypes — not part of the launch path
├── .claude/          Agent skills (generic best practice)
├── CLAUDE.md         Agent instructions and non-negotiables
├── DESIGN.md         Visual and interaction standard
└── README.md         Entry point
```

---

## Backend (`backend/`)

| Path | Purpose |
|---|---|
| `apps/accounts/` | Users, roles, session auth |
| `apps/problems/` | Problems, versions, test groups |
| `apps/submissions/` | Submissions, scoring, judging dispatch |
| `apps/contests/` | Contest lifecycle |
| `apps/progress/` | Normalised learner progress |
| `apps/administration/` | Admin API |
| `apps/audit/` | Append-only audit log |
| `apps/judging/` | Local judge (demo only — not sandboxed) |
| `config/` | Django settings, URLs, Celery |
| `docker-compose.yml` | Postgres, Redis, API, worker |

There is **one** backend. The duplicate copy that lived inside `ui-magic-wand-55/`
was removed during consolidation.

---

## Frontend (`frontend/`)

Built with **TanStack Start** (Vite + TanStack Router + React Query). Real URL
routing — every screen is shareable and survives refresh.

| Path | Purpose |
|---|---|
| `src/routes/` | File-based routes (login, dashboard, problems, contests, …) |
| `src/components/ui/` | shadcn/Radix primitives (button, dialog, table, …) |
| `src/components/` | App shell, code editor, guarded layout |
| `src/lib/api/` | Session-cookie API client and React Query hooks |
| `src/data/mock.ts` | Mock data for screens not yet wired to the API |
| `src/styles.css` | Design tokens (oklch, light default) |
| `.lovable/` | Lovable project metadata — keep if editing in Lovable |

### Routes (learner)

| Route | Screen |
|---|---|
| `/` | Sign in |
| `/dashboard` | Learner dashboard |
| `/problems/` | Problem list |
| `/problems/$id` | Problem workspace (editor + Run/Submit) |
| `/submissions/$id` | Submission result |
| `/contests/` | Contest list |
| `/contests/$id` | Contest workspace |
| `/leaderboard` | Leaderboard |
| `/profile` | Profile |

Admin routes are planned in [UI-BUILD-ORDER.md](UI-BUILD-ORDER.md) Phase 2.

### API proxy

The Vite dev server proxies `/api`, `/healthz`, and `/django-admin` to
`http://localhost:8000` (override with `VITE_API_TARGET`). Same-origin keeps
session cookies and CSRF simple.

---

## Reference (`reference/`)

Not used in production or the demo path. Kept for comparison only.

| Path | What it was |
|---|---|
| `reference/frontend-vite-spa/` | Tab-based Vite SPA (AI Studio export). No URL routing — navigation was `activeTab` state. Layout reference only. |
| `reference/UI.zip` | Earlier UI export backup |

---

## What to read first

1. [DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md) — current status and blockers
2. [UI-BUILD-ORDER.md](UI-BUILD-ORDER.md) — remaining pages and components
3. [RUNNING-THE-DEMO.md](RUNNING-THE-DEMO.md) — start backend + frontend locally
4. [SODAK-TECH-DESIGN.md](SODAK-TECH-DESIGN.md) — domain model and principles

---

## Lovable sync

The frontend was built in [Lovable](https://lovable.dev). The `.lovable/` folder
and `AGENTS.md` in `frontend/` carry project metadata. Changes pushed to the
connected GitHub branch sync back to the Lovable editor.

Avoid force-pushing or rewriting published history on the connected branch — it
breaks Lovable's side.
