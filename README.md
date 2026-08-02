# Sodak-Tech

Competitive programming practice and contest platform. Learners solve problems
in a browser editor, submit code for automated judging against hidden test
cases, receive scored verdicts, track progress, and compete in timed contests.

---

## Layout

```
docs/          The specification. Read these first.
design/        Figma UI reference — source export and per-screen frames.
backend/       Django + DRF API. Models and scoring built; endpoints pending.
frontend/      Next.js + TypeScript portal. Not started.
```

## The specification

Two documents define the platform, and the code cites them by section number
throughout. A comment saying "§4.3" means the reasoning lives there and is worth
reading before changing the code.

| Document | Covers |
|---|---|
| [docs/SODAK-TECH-DESIGN.md](docs/SODAK-TECH-DESIGN.md) | What the platform is: trust zones, domain model, roles, scoring, editorial gating, contest lifecycle, edge cases, security, launch criteria |
| [docs/SODAK-TECH-STACK.md](docs/SODAK-TECH-STACK.md) | What it is built with and how it stays standing: stack choices, performance ordering, failure containment, security hardening by layer, explicit non-choices |
| [docs/UI-GENERATION-PROMPT.md](docs/UI-GENERATION-PROMPT.md) | Paste-ready prompts for generating the frontend with v0 or Lovable, with design tokens, screen briefs, and the API contract the generated UI must code against |
| [docs/STITCH-PROMPTS.md](docs/STITCH-PROMPTS.md) | Per-screen prompts for designing the UI in Google Stitch, with a shared base prompt carrying the design tokens |
| [docs/UI-BUILD-ORDER.md](docs/UI-BUILD-ORDER.md) | Every page and component still to build, sequenced so nothing is blocked by something later in the list |
| [docs/DEVELOPMENT-PLAN.md](docs/DEVELOPMENT-PLAN.md) | **Current build status, what's broken, and prioritised pending work.** Start here if you're picking the project up |

The ten design principles in §2 of the design doc are the ones that actually
constrain the code. The load-bearing ones so far:

1. **The server is the only authority.** The client is a rendering layer that
   can lie about anything.
2. **All learner code is hostile code.**
3. **Trust zones are physically separated.** The machine running untrusted code
   holds no secrets and has no path to the database.
4. **Store raw facts, compute derived values.**
5. **Content is versioned data.** Every submission pins the version it was
   judged against.
10. **Fail closed.**

---

## Where the docs and the code disagree

Two deliberate divergences, decided 2026-07-31. Both are recorded in
[backend/README.md](backend/README.md) in more detail.

**Scope.** The Figma design shows a full LMS layer — Courses, Assignments,
Faculty Portal, Departments. Design doc §1 puts all of it *explicitly out of
scope*. The decision was **judge core first, LMS later**, with clean seams left
for it.

**The fork.** Design doc line 5 calls this "a fork of the QingdaoU OnlineJudge
project". It is not. The backend is a fresh Django build, because the upstream
schema has no concept of versioned problems, weighted test groups, or an
append-only audit log — all three load-bearing here. The upstream *sandbox* is
still intended to be kept (stack doc §2.4).

> **Open item.** Design doc §1 and its opening line are now factually wrong.
> Either amend them, or drop the LMS screens from the Figma design. Leaving the
> contradiction standing invites someone to "fix" the wrong side later.

---

## Status

| Area | State |
|---|---|
| Backend models | Complete for the judge core — problems, versions, test groups, submissions, results, progress, contests, editorials, audit |
| Scoring | Implemented as a pure function of stored results; 20 tests passing |
| Audit log | Append-only, enforced by Postgres trigger against `UPDATE`/`DELETE`/`TRUNCATE` |
| Judging | Not built. Job dispatch, worker token, result protocol are next |
| API endpoints | Not built. URL modules are stubs |
| Frontend | Not started. Design tokens partially extracted — see `design/` |
| MFA | Model fields exist; enforcement not implemented (required by §8.3 before launch) |

Launch criteria are in design doc §10 and stack doc §8. Nothing there is
satisfied yet — that is expected at this stage, but the adversarial submission
suite (§8.6) is called "the highest-leverage test suite in the project" and
should not be left to the end.

## Getting started

See [backend/README.md](backend/README.md). Short version:

```bash
cd backend
cp .env.example .env      # then set DJANGO_SECRET_KEY
docker compose up -d db redis
docker compose run --rm migrate
```
