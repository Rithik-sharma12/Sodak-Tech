# Deployment

How the Sodak-Tech stack goes live. Read `docs/SODAK-TECH-DESIGN.md` §5 (trust
zones) before changing any of this — several choices here are deliberate and
load-bearing, and the shapes below are **evaluation-only**.

> **Judging is not sandboxed.** Submitted code runs in a subprocess on the
> application host with access to the filesystem, network, and database
> credentials. Safe for a controlled demo; never for untrusted users. The admin
> dashboard carries a permanent banner saying exactly this. See
> `docs/DEVELOPMENT-PLAN.md` §4 before anyone but the demo team gets an account.

## The two tiers

| Tier | What | Runs as |
|---|---|---|
| Frontend | TanStack Start SSR + client assets | `node .output/server/index.mjs` (nitro `node-server` build) on `:3000` |
| Backend | Django REST API + Django admin | `gunicorn config.wsgi:application` on `:8000` |
| Edge | TLS, routing, security headers | nginx (see `deploy/nginx.conf`) |
| Infra | Postgres behind PgBouncer, Redis | managed, or the compose file for local eval |

One origin for everything. Session auth rides on an HttpOnly cookie, so the
browser must never see the app and the API on different hosts — that is what
`deploy/nginx.conf` enforces.

## 1. Backend

### 1.1 Container image (recommended)

The backend already builds to a production image:

```bash
cd backend
docker build --target runtime -t sodak-api:$(git rev-parse --short HEAD) .
```

The image runs gunicorn with Uvicorn workers on `:8000`, a non-root user, and a
healthcheck against `/healthz/live`. Run migrations as a one-shot step pointed
at the **database directly, not through PgBouncer** (transaction pooling breaks
session state that DDL relies on):

```bash
# migration role/step goes here once the managed database is provisioned
docker run --rm --env-file .env sodak-api:latest python manage.py migrate --noinput
```

### 1.2 Procfile (platforms that drive processes that way)

`backend/Procfile` mirrors the image command for platforms like Heroku and is
kept in lockstep with the Dockerfile. Two processes:

- `web` — the API
- `worker` — Celery judging worker. **This worker holds database credentials.**
  A real judge worker must live in a network zone with no route to the database
  (design doc §3.1). On a demo box it is fine; do not treat it as the final shape.

### 1.3 Required environment

| Variable | Notes |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` (already the default in `config/wsgi.py` and `config/asgi.py`) |
| `DJANGO_SECRET_KEY` | ≥ 50 chars; startup refuses to run otherwise |
| `DJANGO_ALLOWED_HOSTS` | comma-separated, no `*` |
| `CSRF_TRUSTED_ORIGINS` | the public origin(s), e.g. `https://judge.example.edu` |
| `CORS_ALLOWED_ORIGINS` | the same origin; used by the fail-closed check |
| `DATABASE_URL` | point at **PgBouncer** (transaction mode) in production, not Postgres directly |
| `REDIS_URL` | cache + Celery broker (Celery defaults to `REDIS_URL`) |
| `LOG_LEVEL` | default `INFO` |

`config/settings/prod.py` refuses to start if the configuration is unverifiable
(fail-closed, design principle 10): `DEBUG` on, empty or wildcard `ALLOWED_HOSTS`,
short secret key, non-Argon2 hashers, or pooling-incompatible DB options.

### 1.4 First run

```bash
python manage.py migrate
python manage.py bootstrap --email admin@example.com --username admin   # creates the sole Super Admin
python manage.py collectstatic --noinput                                 # /static/ for the Django admin
```

`bootstrap` creates exactly one Super Admin and nothing else — no demo data
ships. Create learner accounts from the Django admin (`/django-admin/`) or the
admin panel's Users page.

## 2. Frontend

### 2.1 Build

The Lovable build config defaults to the `cloudflare-module` nitro preset, which
is what the Lovable host deploys. For this nginx/node deployment, build with the
node preset — nothing else changes:

```bash
cd frontend
NITRO_PRESET=node-server npm run build
```

Output lands in `.output/`:

- `.output/server/index.mjs` — the SSR server (listens on `$PORT`, default 3000)
- `.output/public/` — client assets

### 2.2 Run

```bash
PORT=3000 node .output/server/index.mjs
```

No runtime configuration is needed: the app calls `/api/...` same-origin, and
nginx routes those to the backend.

## 3. nginx

`deploy/nginx.conf` is a complete site:

- HTTP → HTTPS redirect with an ACME challenge path
- `/api/`, `/healthz`, `/django-admin/`, `/static/` → backend on `:8000`
- everything else → SSR on `:3000`
- `X-Forwarded-Proto: https` (Django's prod settings require it; dropping it is
  the most common silent breakage)
- long proxy timeouts on `/api/` (judging can outlast nginx's 60s default)
- hardened response headers

Wire it up:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sodak
sudo ln -s /etc/nginx/sites-available/sodak /etc/nginx/sites-enabled/sodak
sudo nginx -t && sudo systemctl reload nginx
```

**Lock down `/django-admin/`** — it is Django's full admin and must not be
reachable by the general internet. The config has commented `allow`/`deny`
directives; set the source range to your office or VPN.

## 4. Health checks

- `GET /healthz/live` — the process is up (no database dependency, design doc §4.4)
- `GET /healthz/ready` — database + cache reachable

Liveness probes must use `/healthz/live` so a database blip restarts nothing.

## 5. Known constraints (do not "fix" these silently)

1. **The judge is not sandboxed.** §4 of the development plan is the launch
   blocker for real users. The deployment must keep the warning banner.
2. **This is a single-host evaluation topology.** Design doc §5.3 is explicit:
   production requires managed Postgres/Redis/queue and judge workers in a
   dedicated, network-isolated pool with no route to the database.
3. **Content-Security-Policy is deliberately absent** in nginx (see the comment
   in `deploy/nginx.conf`) — the platform renders learner code, so a wrong
   policy breaks the product before protecting it. Revisit with the sandboxing
   work.
4. **Submissions judge synchronously** unless the Celery worker is running.
   The worker must stay up or a slow submission blocks a web thread.
