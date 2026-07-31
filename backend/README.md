# Sodak-Tech backend

Django + DRF API for the judge platform. Built against
[../docs/SODAK-TECH-DESIGN.md](../docs/SODAK-TECH-DESIGN.md) (what the platform
is) and [../docs/SODAK-TECH-STACK.md](../docs/SODAK-TECH-STACK.md) (what it is
built with and how it stays standing).

Code comments cite those documents by section. When a comment says "§4.3", it
means the reasoning lives there and should be read before changing the code.

---

## Decisions taken at the start

Two questions were resolved before any model was written, because both change
the schema rather than just the implementation.

### 1. Scope: judge core now, LMS later

The Figma design shows a full LMS layer — Courses, Assignments, Faculty Portal,
Departments, Student Analytics. `SODAK-TECH-DESIGN.md` §1 puts all of it
**explicitly out of scope**: "Courses, modules, lessons", "Cohorts, assignments,
deadlines outside contests, gradebooks", "Any learning-management structure
above the problem level."

The judge core is built first, with clean seams for the LMS layer to land
later. Concretely: `Submission` has a documented seam where an assignment
reference goes, and nothing in the judging path assumes its absence.

**The design doc has not been updated.** Its §1 still reads as an exclusion
rather than a deferral. That needs a decision — either amend §1 to say
"deferred", or drop the LMS screens from the Figma design. Leaving the two in
contradiction is the thing to avoid.

### 2. Fresh build, not a fork of QingdaoU OnlineJudge

`SODAK-TECH-DESIGN.md` opens by describing the platform as a fork. It is not
one. The upstream schema has no concept of versioned problems, weighted test
groups, or an append-only audit log — all three are load-bearing requirements
here (principles 4, 5, and 9), and retrofitting them is more work than building
on a schema that has them from the start.

The sandbox is a different matter. `SODAK-TECH-STACK.md` §2.4 says to keep the
upstream seccomp judger, and that still holds — it is proven and hard to
improve on. What is being rebuilt is the application tier around it.

---

## Layout

```
config/            Django project: split settings, celery, root URLs
  settings/
    base.py        shared; all security defaults live here
    dev.py         local only
    prod.py        hardened, with fail-closed startup assertions
apps/
  common/          base models (soft delete, optimistic concurrency), health, errors
  accounts/        User, the five roles, per-resource permission classes
  audit/           append-only AuditLog + the `audited()` transaction helper
  problems/        Problem, immutable ProblemVersion, weighted TestGroup/TestCase
  submissions/     Submission, SubmissionResult, scoring
  progress/        normalized per-(user, problem) progress
  contests/        Contest lifecycle state machine, ContestProblem, Registration
  editorials/      Editorial + server-side unlock evaluation
  judging/         (empty) job dispatch and the worker result protocol
```

## Running it

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(64))"   # paste as DJANGO_SECRET_KEY

docker compose up -d db redis
docker compose run --rm migrate          # runs against db directly, not pgbouncer
docker compose up -d api worker
```

Or locally against the containerised database:

```bash
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver
pytest
```

### Ports

The database publishes on **55432**, not 5432 — this machine already has a local
Postgres on 5432 and another stack's Traefik on 5433. Nothing inside the compose
network uses the published port; it exists only for `psql` and GUI clients.

### Why migrations run against `db`, not `pgbouncer`

PgBouncer runs in transaction pooling mode (§4.3, where it is called mandatory
rather than an optimisation). Transaction pooling hands back a different backend
connection per transaction, which breaks the session state DDL depends on. The
`migrate` service therefore points at `db` directly. Application traffic goes
through the pooler, so local development exercises the same path as production.

---

## What is enforced where

Some invariants are enforced in more than one place on purpose, because the
application-level check alone is bypassable.

| Invariant | Enforced by | Why not just Python |
|---|---|---|
| Audit log is append-only | model overrides **and** a Postgres trigger | `QuerySet.update()`/`delete()` never call `save()`/`delete()`, so a Python-only guard is bypassed by accident. The trigger also covers `TRUNCATE`, which skips row-level triggers entirely. |
| One progress row per (user, problem) | `UniqueConstraint` + `select_for_update` | §3.3 requires the constraint by name. The row lock stops two simultaneous submissions losing an attempt increment. |
| Published problem versions are immutable | `ProblemVersion.save()` | Backstop; the API layer should reject earlier with a validation error. |
| Contest state transitions | `ALLOWED_TRANSITIONS` adjacency map | §7.3 blocks direct field edits. A transition absent from the map is impossible rather than merely discouraged. |
| Editorial content stays hidden | dedicated gated endpoint | §3.6: "Shipping the content and hiding it client-side is not gating." `content` is never in a problem serializer. |

## Verified so far

- All migrations apply cleanly against Postgres 18.4.
- The audit trigger rejects `UPDATE`, `DELETE`, and `TRUNCATE` (checked directly
  in `psql`, not just asserted in a test).
- 20 scoring tests pass, covering per-group all-or-nothing credit, multiplier
  compounding, pinned-rubric precedence, and the "incomplete judging must not
  read as accepted" case.

## Not built yet

- `judging/` is an empty app. Job dispatch, the short-lived per-submission
  worker token (§3.1), and the result protocol are the next piece.
- No API endpoints. `urls.py` modules are stubs; models and services exist below
  them.
- No MFA implementation. `User.mfa_enabled` and `requires_mfa` exist and §8.3
  requires enforcement for privileged roles before launch.
- Rating calculation, standings, and the SSE realtime service.
- The adversarial submission suite (§8.6), which the stack doc calls "the
  highest-leverage test suite in the project".
