# Running the demo

Full stack on localhost: TanStack Start frontend → Django API → Postgres, with
real code execution and real scoring.

---

## ⚠ Read this first

The demo judges submissions with `backend/apps/judging/local_judge.py`, which
runs submitted Python in a plain subprocess **on the machine hosting the
database**. That is exactly the topology [SODAK-TECH-DESIGN.md](SODAK-TECH-DESIGN.md)
§3.1 forbids — no seccomp filter, no process limit, no memory ceiling, no
network isolation.

It exists so the integration can be demonstrated end to end with code you wrote
yourself. It refuses to run when `DEBUG` is false, and it must never be exposed
to submissions from anyone else.

---

## Prerequisites

Docker (for Postgres and Redis), Python 3.13+, Node 20+, npm.

## 1. Backend

```bash
cd backend

# Postgres publishes on 55432 — 5432 and 5433 are taken on this machine.
docker compose up -d db redis

python -m venv .venv
.venv/Scripts/pip install -r requirements/dev.txt      # Linux/macOS: .venv/bin/pip

cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(64))"   # paste as DJANGO_SECRET_KEY

.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py seed_demo
.venv/Scripts/python manage.py runserver localhost:8000
```

`seed_demo` is idempotent — re-run it freely. It creates three problems with
weighted test groups and both sample and hidden cases.

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000** (sign-in is at `/`, not `/login`).

### Use `localhost`, not `127.0.0.1`

Session cookies are `SameSite=Lax`, and browsers treat `localhost` and
`127.0.0.1` as **different sites** — so mixing them makes the browser silently
drop the session cookie and every authenticated request returns 403. Differing
*ports* are fine; differing hostnames are not. Both `.env.local` and the URL you
open must say `localhost`.

## 3. Sign in

```
http://localhost:3000/

  demo@sodak.test
  sodak-demo-2026
```

---

## What to try

Open `/problems/reverse-string` and paste this into the editor:

```python
print(input()[::-1])
```

**Run** executes sample tests only. **Submit** executes every group and scores
the result.

To see partial credit, try `/problems/fizzbuzz` with a solution that misses the
FizzBuzz case:

```python
n = int(input())
for i in range(1, n + 1):
    if i % 3 == 0: print('Fizz')
    elif i % 5 == 0: print('Buzz')
    else: print(i)
```

That scores **40.00** — it passes the two weight-1 groups and fails the weight-3
"Handles FizzBuzz boundary" group. 2 of 5 weight, and the group is all-or-nothing
because §3.5 awards partial credit per group, not per case.

The correct version scores 100.00:

```python
n = int(input())
for i in range(1, n + 1):
    s = ''
    if i % 3 == 0: s += 'Fizz'
    if i % 5 == 0: s += 'Buzz'
    print(s or i)
```

---

## Verified working

- Session auth over CORS with CSRF (`/auth/csrf/` → `/auth/login/`)
- Problem list and detail, publicly readable without a session
- Run (samples only) and Submit (all groups) executing real Python
- Per-test-group verdicts with weighted partial credit
- Idempotency — a repeated key returns the existing submission, not a second one
- Progress tracking: solved state, per-difficulty, per-tag, mastery flags
- Leaderboard and submission history
- Hidden test data withheld from responses; only sample cases carry detail

## Known gaps

| Gap | Note |
|---|---|
| No sandbox | The local judge is a stand-in. Real judging needs isolated workers (§3.1, §8.1) |
| Python only | The judge runs Python; other languages return an error |
| Judging is synchronous | Runs inline in the request. The real path enqueues to a worker pool |
| No MFA | §8.3 requires it enforced for Admin and above before launch |
| No contests seeded | The endpoint works and returns `server_time`; there is no contest data |
| Admin panel unwired | The `/admin/*` pages still use their own mock layer, and several assume models that do not exist — notifications, reports, a "moderator" role |
| Editorials | Gating works end to end, but no editorial content is seeded, so it always reports locked |
