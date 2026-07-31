# Application tier image. Holds secrets at runtime, runs no untrusted code.
#
# The judge worker image is a separate build with entirely different
# requirements -- SODAK-TECH-DESIGN.md §5.1 notes it needs kernel-level control
# and therefore cannot share this base. Do not merge them.

# Pinned by digest, not by tag. SODAK-TECH-STACK.md §5.5 requires it, and
# §5.2 of the design doc explains why: "'Latest compiler' causes silent drift
# in reference timings."
# Refresh deliberately, on a schedule, so advisories do not accumulate.
FROM python:3.14-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Build dependencies land in a stage that is thrown away, so the runtime image
# carries no compiler.
FROM base AS builder

RUN apt-get update && apt-get install --no-install-recommends -y \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip setuptools wheel \
    && /venv/bin/pip install -r requirements/base.txt

# ---------------------------------------------------------------------------

FROM base AS runtime

RUN apt-get update && apt-get install --no-install-recommends -y \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

# Never run as root. Least privilege at every layer (principle 8).
RUN useradd --create-home --shell /usr/sbin/nologin --uid 10001 sodak
COPY --chown=sodak:sodak . /app
USER sodak

EXPOSE 8000

# Liveness only -- readiness is checked by the orchestrator against
# /healthz/ready. §4.4: a liveness probe that checks the database restarts
# every replica when the database blips.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/healthz/live || exit 1

# Graceful shutdown matters here (§4.5): finish in-flight requests, then exit.
# --timeout bounds how long a wedged worker may hold a slot.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--timeout", "60", \
     "--graceful-timeout", "30", \
     "--max-requests", "2000", \
     "--max-requests-jitter", "200", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
