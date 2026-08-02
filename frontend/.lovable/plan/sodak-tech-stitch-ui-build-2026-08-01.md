# Sodak-Tech — Stitch UI Build

Recreate the full Sodak-Tech online-judge interface from the Stitch design as a fresh frontend in this project. UI only, with realistic mock data — no backend, no auth.

## Screens

1. **Login** (`/`) — split layout: left brand panel ("Practice. Compete. Improve.", three feature rows: real-time editor, instant verdicts, timed contests, university footer line); right sign-in card with email, password with visibility toggle, inline error state, remember me, forgot password, Sign in, "or" divider, Continue with Google, create-account link.
2. **Dashboard** (`/dashboard`) — "Welcome back, Priya" + streak line; 4 stat cards (problems solved, acceptance rate, current streak, rating with deltas); weekly activity chart (M–S); topic mastery bars; recent submissions table; "Recommended for you" cards.
3. **Problems** (`/problems`) — header with counts, search, difficulty/topics/status filter dropdowns, active filter chips with reset, table (status icon, title + tags, difficulty, acceptance, solved by, favourite star), pagination "Showing 1–12 of 312".
4. **Problem workspace** (`/problems/$id`) — two panes: left tabs Description / Editorial / Submissions with statement, examples, constraints; right code editor panel with language selector, code area, Run / Submit, test-case console.
5. **Submission result** (`/submissions/$id`) — verdict banner (Wrong Answer), score/runtime/memory, test-group breakdown with weights and pass counts, submitted code block with copy.
6. **Contests** (`/contests`) — rating + global rank header, LIVE contest card with countdown and Enter contest, Upcoming list (register / registered states), Past contests table with rating deltas.
7. **Contest detail** (`/contests/$id`) — frozen-standings banner, problems table (label, status, points, attempts), your-progress panel, standings list with avatars and your highlighted row.
8. **Leaderboard** (`/leaderboard`) — season header, your rank/points, Overall/Weekly/Monthly tabs, search, top-3 podium cards, ranked table with movement arrows, streaks, sticky "YOU" row, pagination.
9. **Profile** (`/profile`) — avatar, name/handle/bio/meta, Edit Profile, statistics panel, solved-problems breakdown by difficulty, contribution activity heatmap, topic strength bars.

## Design system

Match the Stitch look: light neutral background, white cards, thin borders, small radii, blue primary accent, green/amber/red difficulty and verdict colors, monospace for code and IDs. All values as oklch tokens in `src/styles.css` (extra tokens for success/warning/difficulty/verdict states) — no hardcoded colors in components. Material-symbol icons in the design map to matching lucide-react icons.

## Technical notes

- TanStack Router file routes under `src/routes/`; `index.tsx` becomes the login screen; the 8 app screens sit under a shared authenticated-looking shell layout with top nav (Problems, Contests, Leaderboard, Dashboard) and avatar menu.
- Mock data lives in `src/data/*.ts` (problems, submissions, contests, leaderboard, profile) so screens stay presentational and are easy to wire to a real backend later.
- Shared components in `src/components/`: app shell/nav, stat card, difficulty badge, verdict badge, data table, progress bar, pagination, activity heatmap.
- Code editor is a styled textarea with line numbers (no Monaco) to keep it light; can be upgraded later.
- Per-route `head()` metadata with unique titles/descriptions.
