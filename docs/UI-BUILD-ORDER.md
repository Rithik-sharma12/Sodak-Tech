# UI build order

Every page and component still to be built, in the order to build them.

Each step is a self-contained unit: finish it, verify it, move on. The order is
chosen so that nothing is blocked by something later in the list — primitives
before the pages that consume them, and the build fixed before anything is
verified.

**Companion documents:** [DESIGN.md](../DESIGN.md) for how things should look,
[DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md) for the wider project status.

---

## What already exists

**Pages (12):** `/`, `/login`, `/dashboard`, `/problems`, `/problems/[slug]`,
`/contests`, `/leaderboard`, `/profile`, `/settings`, `/admin/dashboard`,
`/admin/problems`, `/admin/users`

**Components (19):** app shell (layout, sidebar, top bar, split pane), admin
shell + data table, code editor, results panel, problem description / editorial /
submissions tabs, and five UI primitives — button, switch, difficulty badge,
verdict badge, skeleton loader.

**Missing primitives are the bottleneck.** Five primitives cannot carry twelve
pages, so pages currently hand-roll their own inputs, tables, and dialogs. That
is why the interface reads as inconsistent. Phase 1 fixes the cause.

---

# Phase 0 — Unblock the build

Nothing below can be verified until this is done. The frontend currently has
10 TypeScript errors.

### 0.1 Clear stale route types
`rm -rf .next/dev/types`. Next's route validator still references five admin
pages that were deliberately deleted.

### 0.2 Add `role` to the `User` type
`lib/api/types.ts` omits `role` although the API returns it, breaking the admin
shell's gate. Add the field and map it in the client's user normaliser.

### 0.3 Recreate `/admin/contests` and `/admin/system-health`
Deleted mid-rewrite. Rebuild against the real admin API.

**Done when:** `npx tsc --noEmit` is clean and every route returns 200.

---

# Phase 1 — Primitives

Build these before any more pages. Every one supports the seven states from
DESIGN.md §8: hover, focus, active, disabled, loading, error, success.

| # | Component | Notes |
|---|---|---|
| 1.1 | **ThemeProvider + ThemeToggle** | Light default, persisted, `data-theme` applied before first paint via blocking inline script. Without the script the page flashes the wrong theme on load. |
| 1.2 | **Input / Textarea** | Label, hint, error text, prefix/suffix slots, invalid state wired to `aria-invalid`. |
| 1.3 | **Select** | Native `<select>` styled to the token set. Do not build a custom listbox — native gets keyboard, mobile, and screen readers right for free. |
| 1.4 | **Checkbox + Radio** | Same `role`-based approach as `Switch`. Never a raw browser control. |
| 1.5 | **Badge** | One primitive; difficulty and verdict badges become presets of it. |
| 1.6 | **Table** | Header, sortable columns, sticky header, zebra off by default, `tnum` on numeric columns, responsive overflow container. |
| 1.7 | **Pagination** | Page numbers, prev/next, total count, disabled edges. |
| 1.8 | **Modal / Dialog** | Focus trap, Escape to close, restore focus on exit, scroll lock. |
| 1.9 | **Drawer** | Same mechanics, edge-anchored. Used for problem filters on mobile. |
| 1.10 | **Toast** | Provider + `useToast`. Success, error, info. Auto-dismiss with a pause on hover. |
| 1.11 | **Dropdown menu** | Outside-click and Escape dismissal, arrow-key roving focus. |
| 1.12 | **Tooltip** | Hover and focus triggered, never the only carrier of meaning. |
| 1.13 | **Tabs** | Arrow-key navigation, `aria-selected`, panel association. |
| 1.14 | **Avatar** | Image with initials fallback, three sizes. |
| 1.15 | **Progress + ProgressRing** | Determinate and indeterminate. |
| 1.16 | **Accordion** | For hints and collapsible statement sections. |
| 1.17 | **Breadcrumb** | Admin needs it once problem detail exists. |
| 1.18 | **EmptyState** | Currently duplicated in the admin shell. Promote to a shared primitive — a fresh install shows these constantly. |
| 1.19 | **Skeleton** (extend) | Text, card, table-row, and avatar variants. |
| 1.20 | **Spinner** | Only for indeterminate waits where no shape is known. |

---

# Phase 2 — Admin, to make an empty install usable

Right now a fresh database cannot be populated through the UI at all. This phase
is the difference between a demo and a dead end.

### 2.1 `/admin/problems/new` — create a problem
Slug (auto from title, editable), title, difficulty, tags, statement, input and
output format, constraints, notes. Markdown editor with preview. Saves as a
draft; a problem is not solvable until a version is published.

### 2.2 `/admin/problems/[slug]` — problem detail
Tabs: **Statement** (edit, with optimistic-concurrency conflict handling) ·
**Versions** (list, publish, diff limits) · **Test data** (per version) ·
**Submissions** (against this problem) · **Danger** (soft delete).

### 2.3 Test group editor
The most involved component in the project. Add and reorder groups, set weight,
mark sample or hidden, add cases inline or by paste, bulk-import from
`input/output` pairs. Must show total weight and warn when no sample group
exists — Run has nothing to execute without one.

### 2.4 Version publish flow
Confirmation dialog stating plainly that publishing makes the version immutable
and that changes afterwards require a new version.

### 2.5 `/admin/audit` — audit log viewer
Filter by action, target type, actor, date. Expandable metadata. Read-only by
construction; there is no delete control because the backend has no such
endpoint. This is the most persuasive screen to show a client about integrity.

### 2.6 `/admin/contests` + `/admin/contests/[slug]`
List with state badges. Detail with the lifecycle state machine rendered as a
diagram, showing which transitions are legal from the current state. Attach
problems with pinned versions and contest labels.

### 2.7 `/admin/system-health`
Dependency checks, queue depth, verdict distribution, and the unsandboxed-judge
warning banner.

### 2.8 `/admin/tags`
Simple CRUD. Blocked deletion when a tag is in use.

---

# Phase 3 — Learner pages, brought to standard

The pages exist but were generated before the design system did.

### 3.1 `/problems` — rebuild
Sortable table, faceted filters (difficulty, tags, status), search, pagination,
saved filter state in the URL so a filtered list is shareable.

### 3.2 `/problems/[slug]` — refine
Split pane with persisted divider position, language selector, font-size control
honouring the Settings preference, keyboard shortcuts (⌘↵ submit, ⌘⇧↵ run),
resizable results panel, per-test-group result display.

### 3.3 `/dashboard` — rebuild
Bento grid: stat tiles, activity chart, topic mastery bars, recent submissions,
recommended problems. Every tile a modular card.

### 3.4 `/profile` and `/profile/[username]`
Public profile currently does not exist — only your own. Add the parameterised
route, contribution heatmap, solved breakdown, activity timeline.

### 3.5 `/leaderboard` — rebuild
Virtualised table, sticky header, pinned current-user row, period tabs.

### 3.6 `/contests` and `/contests/[slug]`
Detail page does not exist. Needs countdown from server time, problem list,
standings, registration.

### 3.7 `/submissions` and `/submissions/[id]`
No global submission history exists. Add the list and a detail view with
per-group results and the source that was submitted.

---

# Phase 4 — Pages that do not exist at all

### 4.1 `/register`
Sign-up. Currently there is no way to create an account through the UI.

### 4.2 `/forgot-password` and `/reset-password/[token]`
Both linked from login; neither exists. Needs backend endpoints first.

### 4.3 `/verify-email/[token]`
If email verification is wanted.

### 4.4 `/onboarding`
First-run for a new account: pick languages, set a goal, tour the editor.

### 4.5 Error pages
`not-found.tsx`, `error.tsx`, `global-error.tsx`. Next currently renders its
defaults, which look nothing like the product.

### 4.6 `/offline` + loading skeletons per route
`loading.tsx` for every route segment so navigation never shows a blank frame.

---

# Phase 5 — Cross-cutting

### 5.1 Command palette (⌘K)
Jump to problem, contest, or admin page. The single highest-leverage addition for
the audience this product has.

### 5.2 Keyboard shortcut help (`?`)
Overlay listing every binding.

### 5.3 Global search
Currently the top bar search only routes to `/problems`. Make it search problems,
contests, and users with grouped results.

### 5.4 Notification centre
Requires a backend model that does not exist. Deferred deliberately — the top bar
shows an honest empty state rather than invented rows.

### 5.5 Responsive pass
Every page at 320px, 768px, 1024px, 1440px. No horizontal body scroll anywhere.

### 5.6 Accessibility audit
Keyboard traversal of every flow, contrast verified in **both** themes, screen
reader pass on the editor and submission flow.

---

## Suggested sequence

If working straight through:

1. **Phase 0** — half a day. Unblocks everything.
2. **Phase 1.1** (theming) — the client asked for it explicitly.
3. **Phase 1.2–1.8** — the primitives Phase 2 depends on.
4. **Phase 2.1–2.4** — problem authoring. After this the platform is usable.
5. **Phase 2.5** — audit viewer. Strongest demo screen.
6. **Phase 3.1–3.2** — the two pages users spend all their time in.
7. **Phase 4.1, 4.5** — registration and error pages, both conspicuous by absence.
8. Everything else by need.

**Alpha demo needs:** Phase 0, 1.1–1.8, 2.1–2.5, 3.1–3.2, 4.1, 4.5.

Everything after that improves the product; nothing before it is optional.
