# UI generation prompt

Paste-ready prompts for generating the frontend with **v0** or **Lovable**, plus
everything those tools need to produce code that drops into this project without
being rewritten.

---

## Before you start

### Use v0, not Lovable

Both work, but v0 is the better fit here and it is not close:

- v0 outputs **Next.js + TypeScript + Tailwind + shadcn/ui**, which is the stack
  [SODAK-TECH-STACK.md](SODAK-TECH-STACK.md) §1 already specifies.
- Lovable defaults to **Supabase** for data and auth. This project has a Django
  backend with a specific auth model, five roles, and a judging pipeline. You
  would spend more time tearing Supabase out than the UI saves you.

If you use Lovable anyway, see the Lovable variant at the bottom — the critical
instruction is to forbid it from adding any backend.

### Go screen by screen, not all at once

Do **not** paste all fifteen screens in one prompt. These tools degrade badly
past a certain input size, and you get generic output.

The order that works:

1. Paste **Prompt 1 (Foundation)** with `design/frames/00-style-guide.png`
   attached. This establishes tokens and primitives.
2. Then one screen at a time, using **Prompt 2**, attaching that screen's PNG.
3. Start with `05-problem-detail-editor.png` — it is the densest screen and
   carries the most component variants. Everything after it gets easier.

### Which screens to build

Build these seven. They are the judge core:

| Attach | Screen |
|---|---|
| `02-auth-login.png` | Login |
| `03-student-dashboard.png` | Dashboard |
| `04-problem-list.png` | Problem list |
| `05-problem-detail-editor.png` | Problem + editor ← **start here** |
| `06-profile.png` | Profile |
| `07-contests-arena.png` | Contests |
| `10-global-leaderboard.png` | Leaderboard |

**Skip these for now** — they are the LMS layer that is deferred (see the scope
note in the root [README](../README.md)): `09-assignments-overview.png`,
`12-faculty-portal-overview.png`, `13-faculty-design-challenge.png`,
`14-student-analytics.png`.

---

## Prompt 1 — Foundation

> Attach: `design/frames/00-style-guide.png`

```
Build the foundation for a competitive programming platform frontend called
Sodak-Tech. This is a dark-themed coding practice site where users solve
algorithm problems in a browser editor and compete in timed contests.

STACK — use exactly this, do not substitute:
- Next.js (App Router) + TypeScript, strict mode
- Tailwind CSS
- shadcn/ui for primitives
- CodeMirror 6 for the code editor (NOT Monaco — bundle size matters here)
- lucide-react for icons

DO NOT ADD A BACKEND. No Supabase, no Prisma, no auth provider, no database,
no API routes that persist anything. A Django REST API already exists. All
data access must go through a mock layer I will describe below.

DESIGN TOKENS — use these exact values, do not invent a palette. Put them in
globals.css as CSS custom properties and wire them into tailwind.config.ts:

  Surfaces (dark theme is the default and only theme for now):
    --surface-base:    #0B1326   /* page background */
    --surface-card:    #171F33   /* cards, panels */
    --surface-raised:  #222A3D   /* secondary buttons, hover states */

  Primary ramp:
    50 #EDF0FF, 100 #D8E2FF, 200 #ADC6FF, 300 #81AAFF, 400 #4D8EFF,
    500 #2573E6, 600 #005AC2, 700 #004395, 800 #002E6A, 900 #001A42

  Secondary ramp:
    50 #EBF1FF, 100 #D4E3FF, 200 #A4C9FF, 300 #6EAEFF, 400 #4C93E7,
    500 #2A79CB, 600 #0060AC, 700 #004883, 800 #00315D, 900 #001C39

  Tertiary ramp (accent / warnings):
    50 #FFEDE4, 100 #FFDCC6, 200 #FFB786, 300 #FF8E33, 400 #DF7412,
    500 #BB5D00, 600 #964900, 700 #723600, 800 #502400, 900 #311400

  Neutral ramp:
    50 #EEF0FF, 100 #DAE2FD, 200 #BEC6E0, 300 #A3ABC4, 400 #8990A8,
    500 #6F778E, 600 #565E74, 700 #3F465C, 800 #283044, 900 #131B2E

IMPORTANT about the ramps: components use ramp steps, not raw brand colors.
  - Primary button fill:   #ADC6FF (primary-200) with dark navy text
  - Inverted button fill:  #DAE2FD (neutral-100) with dark navy text
  - Secondary button fill: #222A3D (surface-raised) with light text
  - Outlined button:       transparent, 1px border, light text
  - Accent icon button:    #DF7412 (tertiary-400)
Note the primary button is a LIGHT periwinkle on a dark background, not a
saturated blue. This is deliberate — match it.

TYPOGRAPHY:
  - Headings:  Geist
  - Body:      Inter
  - Code/labels: JetBrains Mono
Load via next/font. Use a standard 4px spacing scale and Tailwind's default
radius scale.

BUILD IN THIS PASS:
1. Tailwind config + globals.css with the tokens above
2. App shell: collapsible left sidebar (Dashboard, Problems, Contests,
   Leaderboard, Profile, Settings) + top bar with search, notifications bell,
   theme toggle, avatar
3. shadcn primitives themed to the tokens: Button (primary/secondary/inverted/
   outlined/ghost), Input, Select, Badge, Card, Table, Tabs, Dialog, Tooltip,
   Progress, Avatar, DropdownMenu, Skeleton
4. Domain badge components, since these recur on every screen:
   - DifficultyBadge: easy | medium | hard
   - VerdictBadge: accepted | wrong_answer | time_limit_exceeded |
     memory_limit_exceeded | output_limit_exceeded | runtime_error |
     compile_error | presentation_error | sandbox_violation | internal_error |
     cancelled | pending | queued | compiling | running
   Accepted reads green, failures read red, resource limits read amber,
   pending/running read neutral with a subtle pulse.

DATA LAYER — this part matters most, follow it exactly:
Create lib/api/ with:
  - types.ts    — all TypeScript types and string-union enums
  - client.ts   — a single typed fetch wrapper. Base URL from
                  NEXT_PUBLIC_API_URL, always credentials: 'include',
                  sends the X-CSRFToken header read from the csrftoken cookie.
  - mock.ts     — mock data implementing the same function signatures
  - index.ts    — exports mock or real based on NEXT_PUBLIC_USE_MOCKS
Every component imports from lib/api — no component may call fetch directly
and no component may hardcode data inline. I need to swap mocks for the real
API by editing one directory.

Match the attached style guide image for colors, type, and button treatments.
```

---

## Prompt 2 — Per screen

> Attach: the one screen PNG. Repeat per screen.

```
Build the [SCREEN NAME] screen, matching the attached design closely.

Use the existing design tokens, app shell, shadcn primitives, and lib/api
data layer already in this project. Do not introduce a new palette, do not
add a backend, do not call fetch directly from components.

[Paste the screen's brief from the "Screen briefs" section below]

Requirements:
- Fully responsive; the layout must not scroll horizontally on mobile
- Loading states use Skeleton, not spinners
- Empty states are designed, not blank
- Keyboard accessible, visible focus rings, correct ARIA roles on
  interactive elements
- Long lists (submissions, standings) must be virtualized — these render
  thousands of rows and a full render freezes low-end devices
```

---

## Screen briefs

Paste the relevant one into Prompt 2.

### Problem + editor — `05-problem-detail-editor.png` (start here)

```
Two-pane split view with a draggable divider.

LEFT PANE — tabs: Description | Editorial | Submissions
  Description tab: title with difficulty badge and topic tags, statement
  body, worked examples with input/output blocks, constraints block.
  Editorial tab: locked by default. Show a lock state explaining what
  unlocks it ("solve it, make 3 genuine attempts, or wait 24h") — never
  render editorial content that arrives locked.
  Submissions tab: this user's past attempts at this problem, with verdict,
  language, runtime, memory, and relative time.

RIGHT PANE — CodeMirror 6 editor
  Toolbar: language selector, theme toggle, reset, font size, fullscreen.
  Bottom action bar: "Run" (secondary, runs sample tests only) and
  "Submit" (primary, runs all tests).
  Below the editor, a results panel with tabs: Console | Test Cases | Output.
  Test Cases shows one row per sample case with pass/fail, expected vs
  actual, runtime and memory.
  On submit, show a queued state immediately and optimistically — never
  block the UI on the network.
```

### Problem list — `04-problem-list.png`

```
Dense sortable table: status icon, ID, title, difficulty badge, acceptance
rate, topic tags, favourite star.
Filter bar above: search input, difficulty select, topics multiselect,
status select (all/solved/attempted/todo), reset.
Right sidebar: "Daily Challenge" card, "Continue" card resuming the last
in-progress problem, "Recommended for you" list.
Numbered pagination with a total count. Row hover reveals a quick-preview
affordance.
```

### Dashboard — `03-student-dashboard.png`

```
Greeting header with the user's name and a streak indicator.
Stat tile row: Problems Solved, Acceptance Rate, Current Streak, Weekly Goal
— each with a delta versus last period.
Weekly Coding Activity: bar chart, last 7 days.
Topic Mastery: horizontal labelled progress bars per topic.
Recommended Problems list.
Recent Submissions table: problem, verdict badge, language, relative time.
```

### Login — `02-auth-login.png`

```
Split screen. Left: marketing panel — headline "Master Coding. Track
Progress. Get Placement Ready.", three feature pills with icons. Right:
centred auth card — email, password with reveal toggle, remember me, forgot
password, primary sign-in button, divider, Google OAuth button, sign-up link.
Inline field validation. Do not implement real auth — call the mock layer.
```

### Profile — `06-profile.png`

```
Left column: avatar, name, title, bio, location, join date, links, Follow
button, and an Edit Profile / Privacy / Account menu.
Right column: solved-problems breakdown by difficulty with progress rings,
a GitHub-style year contribution heatmap, badges and achievements grid,
skills and languages with a distribution bar, recent submissions table.
```

### Contests — `07-contests-arena.png`

```
Header with the user's global rank and current rating.
LIVE NOW card: contest name, countdown timer, participant count, problem
count, prize pool, the user's rank, prominent "Enter Arena" button.
The countdown must derive from a server-provided time offset, not the
browser clock — expose it as a prop, do not read Date.now() directly.
Top 5 Live standings list.
Upcoming contests grid: cards with rated/unrated badge, start time, duration,
Register button.
```

### Leaderboard — `10-global-leaderboard.png`

```
Podium for the top 3 — centre position elevated, avatars, scores, medals.
Below: ranked table with rank delta arrows, student, department, solved
count, streak, XP score. The current user's row is pinned and highlighted.
Filter tabs (Overall / Weekly / Monthly), a search input, and a department
select. Season countdown in the header. Virtualize the table.
```

---

## API contract

Have the generated mock layer match these shapes exactly. They mirror the
Django models, so swapping mocks for the real API becomes a one-directory
change instead of a reshaping exercise.

```ts
// Enums — these are the exact server values.
type Difficulty = 'easy' | 'medium' | 'hard';

type Verdict =
  | 'pending' | 'queued' | 'compiling' | 'running'
  | 'accepted' | 'wrong_answer' | 'time_limit_exceeded'
  | 'memory_limit_exceeded' | 'output_limit_exceeded'
  | 'runtime_error' | 'compile_error' | 'presentation_error'
  | 'sandbox_violation' | 'internal_error' | 'cancelled';

type ProgressState = 'not_attempted' | 'attempted' | 'partial' | 'solved';
type Role = 'user' | 'problem_setter' | 'contest_manager' | 'admin' | 'super_admin';
type ContestState =
  | 'draft' | 'published' | 'running' | 'frozen'
  | 'paused' | 'ended' | 'provisional' | 'final';

interface ProblemListItem {
  id: string;               // UUID
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: { slug: string; name: string }[];
  acceptance_rate: number;  // 0..1
  solved_count: number;
  progress_state: ProgressState;
  is_favourite: boolean;
}

interface ProblemDetail extends ProblemListItem {
  statement: string;        // markdown
  input_format: string;
  output_format: string;
  constraints: string;
  notes: string;
  examples: { input: string; output: string; explanation?: string }[];
  time_limit_ms: number;
  memory_limit_mb: number;
  problem_version_id: string;
  languages: { id: string; name: string; version: string }[];
  editorial_unlocked: boolean;   // server-decided; never decide this client-side
}

interface Submission {
  id: string;
  problem_slug: string;
  problem_title: string;
  language: string;
  verdict: Verdict;
  score: string;            // decimal as string
  max_runtime_ms: number | null;
  max_memory_kb: number | null;
  received_at: string;      // ISO 8601
  results: SubmissionResult[];
}

interface SubmissionResult {
  test_group_name: string;
  verdict: Verdict;
  passed: boolean;
  cases_total: number;
  cases_passed: number;
  weight: number;
  max_runtime_ms: number | null;
  max_memory_kb: number | null;
  first_failing_case_index: number | null;
}

interface UserProgress {
  problems_solved: number;
  problems_attempted: number;
  acceptance_rate: number;
  current_streak: number;
  by_difficulty: Record<Difficulty, { solved: number; total: number }>;
  by_tag: { tag: string; solved: number; total: number; mastery: boolean }[];
  activity: { date: string; count: number }[];
}

interface Contest {
  id: string;
  slug: string;
  title: string;
  state: ContestState;
  starts_at: string;
  ends_at: string;
  is_rated: boolean;
  problem_count: number;
  participant_count: number;
  registered: boolean;
  server_time: string;      // drive countdowns from this, never Date.now()
}
```

**Endpoints** (base `/api/v1/`, session-cookie auth, CSRF header required on
writes):

```
POST   auth/login/                  { email, password }
POST   auth/logout/
GET    auth/me/

GET    problems/                    ?search=&difficulty=&tags=&status=&page=
GET    problems/{slug}/
GET    problems/{slug}/editorial/   403 when locked — content is never sent locked

POST   submissions/                 { problem_slug, language, source_code,
                                      kind: 'run'|'submit', idempotency_key }
GET    submissions/{id}/
GET    submissions/?problem=&page=

GET    progress/me/
GET    contests/
GET    contests/{slug}/
GET    contests/{slug}/standings/
```

### Three rules the UI must not break

These come straight from the design doc and are easy to get wrong by accident:

1. **Editorial content is server-gated.** Render whatever the server sends. Do
   not fetch it and hide it — shipping the content and hiding it client-side is
   not gating.
2. **Countdowns use server time.** Take the offset from `server_time` on load.
   A browser clock that is wrong or deliberately altered must not change what
   the contest does.
3. **Hidden test data never reaches the client.** Show verdicts and at most a
   failing test index during contests. Never inputs, never diffs.

---

## Lovable variant

If you use Lovable instead, prepend this to Prompt 1:

```
Do NOT set up Supabase. Do NOT create a database, authentication, or any
backend. This project already has a Django REST API. Build frontend only —
UI components, routing, and a mock data layer in lib/api/ that I will later
point at the real API. If you would normally scaffold a backend, skip that
step entirely.
```

Everything else in Prompt 1 applies unchanged.

---

## After you download the generated folder

Put it at the repo root as `frontend/`, then tell me. I will:

1. **Review it before wiring anything.** Generated code tends to arrive with
   inline data, duplicated types, and occasional invented endpoints. Cheaper to
   find now than after integration.
2. **Reconcile types** against the real Django serializers so there is one
   definition, not two that drift.
3. **Replace `lib/api/mock.ts`** with real calls, including CSRF handling and
   the session cookie.
4. **Build the API endpoints** on the Django side to match — they do not exist
   yet, only the models do.
5. **Add the submission polling / SSE path** so a verdict updates live after
   submit.
6. **Check the three rules above** actually hold in the generated code.
7. **Wire it into Docker Compose** alongside the API.

Expect step 1 to find real work. That is normal for generated UI and it is why
the prompt insists on isolating all data access in `lib/api/` — it keeps the
integration surface to one directory instead of scattered through every
component.
