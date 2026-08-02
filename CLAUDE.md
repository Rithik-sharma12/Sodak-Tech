# Project instructions

## Document precedence

When guidance conflicts, this is the order:

1. **`docs/SODAK-TECH-DESIGN.md`** and **`docs/SODAK-TECH-STACK.md`** — the
   specification. Code cites these by section number; a comment saying "§4.3"
   means the reasoning lives there.
2. **`DESIGN.md`** — the visual and interaction standard. Wins over the Figma
   frames in `design/`, which predate the light theme.
3. **`.claude/skills/`** — installed third-party skills. General best practice
   only. **They never override 1 or 2.**

## Installed skills and where they disagree with this project

`.claude/skills/` holds eight skills from
[Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills) (MIT):
django-expert, nextjs-developer, react-expert, typescript-pro, postgres-pro,
security-reviewer, test-master, api-designer.

They are generic. Two known conflicts, where this project wins:

**Authentication.** `django-expert` and `api-designer` default to JWT via
SimpleJWT, with bearer tokens. This project uses **session cookies, HttpOnly,
SameSite=Lax**. Stack doc §5.1 is explicit: *"Authentication tokens in HTTP-only,
secure, same-site cookies — never in browser storage, which is readable by any
injected script."* That matters more here than in a typical app, because the
platform renders untrusted learner code — an XSS would read any token in
localStorage. Do not migrate to JWT.

**Frontend framework.** `react-expert` assumes a plain React SPA. The frontend is
Next.js App Router with real URL routing. The Vite/React app in
`sodak-tech-competitive-programming/` is a *design reference* only — it has no URL
routing (navigation is `activeTab` state), so problem links cannot be shared and
refresh loses your place. Port its layouts; do not adopt its architecture.

## Non-negotiables

These come from the design doc's ten principles and are the ones most often
broken by accident:

- **The server is the only authority.** Role checks in the UI are for rendering,
  never for access control (§3.4).
- **Published problem versions are immutable.** Replacing test data creates a new
  version, never an edit (§7.3).
- **The audit log is append-only.** No edit or delete endpoint exists, and a
  Postgres trigger enforces it. Do not add one (§8.3).
- **Hidden test data never reaches the client.** Only `is_sample` groups are
  serialised to learners (§8.1).
- **Progress is a normalized table** with a unique constraint on
  (user, problem) — never a blob (§3.3).
- **Soft delete throughout.** Nothing with history is hard-deleted (§9).
- **Contest state changes only via `transition_to`**, validated against the
  adjacency map. Never a direct field edit (§3.7, §7.3).

## Known state

See `docs/DEVELOPMENT-PLAN.md` for current status and pending work, and
`docs/UI-BUILD-ORDER.md` for the remaining pages and components.

**The judge is not sandboxed.** Submitted code runs in a subprocess on the
application host with access to the filesystem, network, and database
credentials. Acceptable for a controlled demo, not for untrusted users. The admin
dashboard carries a permanent banner saying so. This is the single most important
outstanding item (design plan §4).

## Conventions

- Python: ruff, line length 100, type hints. Tests with pytest.
- TypeScript: strict mode. No `any` without a comment explaining why.
- All colour through design tokens in `frontend/app/globals.css`. No hardcoded
  hex in components, no `dark:` variants — the token set switches themes.
- Comments explain *why*, citing a doc section where one applies. Do not narrate
  what the code already says.
