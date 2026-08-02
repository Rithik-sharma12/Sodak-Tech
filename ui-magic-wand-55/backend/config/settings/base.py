"""Settings shared by every environment.

Anything environment-specific lives in dev.py or prod.py. Anything secret comes
from the environment and never from this file (SODAK-TECH-STACK.md §5.6).
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
env.read_env(BASE_DIR / ".env")

# --------------------------------------------------------------------------
# Core
# --------------------------------------------------------------------------

SECRET_KEY = env("DJANGO_SECRET_KEY")

# Overridden per environment. Never default to True -- a debug page leaks
# configuration including credentials (§5.2).
DEBUG = False

# No permissive default. An empty allowlist fails closed.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

AUTH_USER_MODEL = "accounts.User"

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------------------------------------------------------------
# Applications
# --------------------------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
]

# Order matters for migrations: accounts before anything with a user FK,
# audit early so its table exists before other apps write to it.
LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.audit",
    "apps.problems",
    "apps.submissions",
    "apps.progress",
    "apps.judging",
    "apps.editorials",
    "apps.contests",
    "apps.administration",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --------------------------------------------------------------------------
# Database
# --------------------------------------------------------------------------
#
# CONN_MAX_AGE is 0 and server-side cursors are disabled because PgBouncer runs
# in transaction pooling mode in front of this (SODAK-TECH-STACK.md §4.3).
# Persistent connections and server-side cursors both break under transaction
# pooling -- the connection you get back is not the one you had.

DATABASES = {
    "default": {
        **env.db("DATABASE_URL"),
        "CONN_MAX_AGE": 0,
        "DISABLE_SERVER_SIDE_CURSORS": True,
        "OPTIONS": {
            # §4.2: every outbound call carries an explicit timeout. An
            # unbounded wait is the most common cause of cascading failure.
            "connect_timeout": env.int("DB_CONNECT_TIMEOUT", default=5),
        },
        "ATOMIC_REQUESTS": False,
    }
}

# --------------------------------------------------------------------------
# Cache
# --------------------------------------------------------------------------
#
# The cache is reconstructible, never authoritative (§4.9). Every read path
# that uses it must survive its absence -- see §4.8, "Serve from database;
# slower, fully functional."

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": env.int("REDIS_CONNECT_TIMEOUT", default=3),
            "SOCKET_TIMEOUT": env.int("REDIS_SOCKET_TIMEOUT", default=3),
            # A cache outage must degrade, not raise.
            "IGNORE_EXCEPTIONS": True,
        },
    }
}

DJANGO_REDIS_IGNORE_EXCEPTIONS = True

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

# --------------------------------------------------------------------------
# Authentication
# --------------------------------------------------------------------------
#
# §5.2 requires memory-hard password hashing. Argon2 is first, so new and
# rotated passwords use it; the rest remain only to verify legacy hashes.

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# §8.3: privileged sessions expire sooner than learner sessions. The shorter
# ceiling is applied per-session in the accounts app on login.
SESSION_COOKIE_AGE = env.int("SESSION_COOKIE_AGE", default=60 * 60 * 24 * 14)
PRIVILEGED_SESSION_COOKIE_AGE = env.int("PRIVILEGED_SESSION_COOKIE_AGE", default=60 * 60 * 4)

# §8.3: destructive admin actions require re-authentication within this window.
REAUTH_WINDOW_SECONDS = env.int("REAUTH_WINDOW_SECONDS", default=60 * 15)

# --------------------------------------------------------------------------
# Cookies and CSRF
# --------------------------------------------------------------------------
#
# §5.1: tokens live in HTTP-only cookies, never in browser storage, which is
# readable by any injected script -- and this platform renders untrusted code.

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False  # the SPA must read this to echo it back
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=[])

# --------------------------------------------------------------------------
# Security headers (§5.2)
# --------------------------------------------------------------------------

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# --------------------------------------------------------------------------
# REST framework
# --------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    # Fail closed: endpoints are authenticated unless they opt out explicitly.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.CursorSetPagination",
    "PAGE_SIZE": 25,
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.common.exceptions.exception_handler",
    # §5.2: rate limiting at the application layer enforces per-identity
    # fairness. The edge absorbs raw volume separately.
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "auth": "10/min",
        "submission": "30/min",
        "run": "60/min",
        "read": "300/min",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Sodak-Tech API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --------------------------------------------------------------------------
# Celery
# --------------------------------------------------------------------------
#
# Redis is the broker for local development only. Production uses a managed
# durable queue -- §6 of SODAK-TECH-STACK.md lists an in-memory broker as an
# explicit non-choice because a restart during a contest loses submissions.

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default=env("REDIS_URL"))
CELERY_RESULT_BACKEND = None  # results are persisted in Postgres, not the broker
CELERY_TASK_ACKS_LATE = True  # redeliver if a worker dies mid-judge (§4.5)
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # fair dispatch; jobs are long and uneven
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_TIME_LIMIT = env.int("CELERY_TASK_TIME_LIMIT", default=600)
CELERY_TASK_SOFT_TIME_LIMIT = env.int("CELERY_TASK_SOFT_TIME_LIMIT", default=540)

# §3.5 / §4.1: separate lanes so practice traffic cannot delay contest judging.
CELERY_TASK_QUEUES_PRACTICE = "judge.practice"
CELERY_TASK_QUEUES_CONTEST = "judge.contest"
CELERY_TASK_DEFAULT_QUEUE = CELERY_TASK_QUEUES_PRACTICE

# --------------------------------------------------------------------------
# Platform limits
# --------------------------------------------------------------------------
#
# §4.1: bounded queues are the single most important stability control.
# Accepting work that cannot be completed is how an outage becomes data loss.

MAX_SUBMISSION_BYTES = env.int("MAX_SUBMISSION_BYTES", default=64 * 1024)
MAX_INFLIGHT_SUBMISSIONS_PER_USER = env.int("MAX_INFLIGHT_SUBMISSIONS_PER_USER", default=3)
MAX_QUEUE_DEPTH_PRACTICE = env.int("MAX_QUEUE_DEPTH_PRACTICE", default=5000)
MAX_QUEUE_DEPTH_CONTEST = env.int("MAX_QUEUE_DEPTH_CONTEST", default=20000)

# §8.5: per-problem cooldown prevents binary-searching hidden test data
# through repeated probe submissions.
SUBMISSION_COOLDOWN_SECONDS = env.int("SUBMISSION_COOLDOWN_SECONDS", default=5)

# --------------------------------------------------------------------------
# Judging
# --------------------------------------------------------------------------
#
# Submitted code runs in a throwaway container with no network, no
# credentials, dropped capabilities and cgroup ceilings -- see
# apps/judging/sandbox.py for the boundary these values enforce.

JUDGE_SANDBOX_IMAGE = env("JUDGE_SANDBOX_IMAGE", default="sodak-judge-sandbox:latest")

# The dispatcher's route to the container runtime. This socket is equivalent to
# host root (§5.4) and is mounted into the dispatcher only. It must never be
# mounted into the sandbox image.
JUDGE_DOCKER_HOST = env("JUDGE_DOCKER_HOST", default="unix:///var/run/docker.sock")
JUDGE_DOCKER_TIMEOUT = env.int("JUDGE_DOCKER_TIMEOUT", default=120)

# §4.2: the container is bounded independently of the per-case limits inside
# it, so a wedged runner cannot hold a worker slot indefinitely.
JUDGE_CONTAINER_TIMEOUT = env.int("JUDGE_CONTAINER_TIMEOUT", default=300)

# Headroom above the problem's own memory limit for the interpreter or runtime
# itself. Without it, a Python solution well inside its limit is killed by the
# cost of starting Python.
JUDGE_MEMORY_HEADROOM_MB = env.int("JUDGE_MEMORY_HEADROOM_MB", default=192)

# A fork bomb hits this rather than the host's process table.
JUDGE_PIDS_LIMIT = env.int("JUDGE_PIDS_LIMIT", default=256)

# CPU cores available to one sandbox. §3.5 wants uniform CPU across the fleet,
# because mixed capacity turns the time limit into a lottery.
JUDGE_CPU_LIMIT = env.float("JUDGE_CPU_LIMIT", default=1.0)

# The sandbox's only writable surface, and it does not survive the container.
JUDGE_TMPFS_MB = env.int("JUDGE_TMPFS_MB", default=64)

# Judge through the queue (the real path) or inline in the request. Inline is
# for running the API without a worker; it still uses the same sandbox, so the
# isolation is identical -- only the dispatch differs.
JUDGE_ASYNC = env.bool("JUDGE_ASYNC", default=True)

# §3.6: editorial unlock thresholds, enforced server-side on every fetch.
EDITORIAL_UNLOCK_ATTEMPTS = env.int("EDITORIAL_UNLOCK_ATTEMPTS", default=3)
EDITORIAL_UNLOCK_COOLDOWN_HOURS = env.int("EDITORIAL_UNLOCK_COOLDOWN_HOURS", default=24)

# §3.5: viewing an editorial or a hint scales the score but never mastery.
EDITORIAL_SCORE_MULTIPLIER = env.float("EDITORIAL_SCORE_MULTIPLIER", default=0.5)
HINT_SCORE_MULTIPLIER = env.float("HINT_SCORE_MULTIPLIER", default=0.8)

# --------------------------------------------------------------------------
# Internationalisation
# --------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"  # all stored timestamps are UTC; the client localises
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------
# Static and media
# --------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Test data never lives on a judge worker's disk and is never public.
# In production this is object storage with a restricted prefix (§5.3).
MEDIA_ROOT = BASE_DIR / "media"

# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------
#
# §9 of the design doc: observability from day one. Structured output so the
# collector can index it rather than regex it.

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {name} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
    "loggers": {
        "django.db.backends": {"level": "WARNING", "propagate": False},
        # The audit trail is not deletable through the application (§8.3), so
        # its logger is separate and always on.
        "sodak.audit": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "sodak.judge": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
