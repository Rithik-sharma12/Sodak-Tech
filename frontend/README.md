# Sodak-Tech frontend

TanStack Start + React 19 learner portal for the Sodak-Tech online judge.

Built from the [Stitch design](https://stitch.withgoogle.com/preview/791787020225748116)
via [Lovable](https://lovable.dev). Live preview:
https://ui-magic-wand-55.lovable.app

## Stack

- **TanStack Start** — Vite-based SSR with file routes
- **TanStack Router** — shareable URLs for every screen
- **TanStack Query** — server state and caching
- **Tailwind CSS v4** — design tokens in `src/styles.css`
- **shadcn/ui + Radix** — accessible primitives in `src/components/ui/`
- **CodeMirror 6** — in-browser code editor

## Development

**Prerequisites:** Node 20+, backend running on `localhost:8000`.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Use `localhost`, not `127.0.0.1` — session
cookies are `SameSite=Lax` and browsers treat those hostnames as different sites.

The dev server proxies `/api` to the Django backend. Override the target:

```bash
VITE_API_TARGET=http://localhost:8000 npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Project layout

```
src/
├── routes/           File-based pages
├── components/ui/    Design-system primitives
├── components/       App shell, editor, guards
├── lib/api/          Session-cookie API client
├── data/mock.ts      Mock data for unwired screens
└── styles.css        oklch design tokens
```

See [docs/PROJECT-STRUCTURE.md](../docs/PROJECT-STRUCTURE.md) for the full
repository layout.

## Lovable

Continue editing in the [Lovable editor](https://lovable.dev/projects/7b42c109-47a0-4864-a79c-2e9c1c5fe491).
Changes sync to this repository on push.
