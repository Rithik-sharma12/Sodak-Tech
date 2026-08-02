"""Production settings.

Design principle 10 is "fail closed" -- if the environment cannot be verified
as configured, refuse to start rather than serve traffic in an unknown state.
The checks at the bottom of this file are that principle applied to config.
"""

from .base import *  # noqa: F403
from .base import env

DEBUG = False

# No default. Missing ALLOWED_HOSTS raises at import rather than serving with a
# permissive value.
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS")

# --------------------------------------------------------------------------
# Transport security (§5.2)
# --------------------------------------------------------------------------

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Behind a load balancer that terminates TLS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# JSON only. The browsable API renders user-controlled content and has no place
# in production.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

# --------------------------------------------------------------------------
# Fail-closed configuration checks
# --------------------------------------------------------------------------


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(f"Refusing to start: {message}")


_require(not DEBUG, "DEBUG is enabled in production")
_require(bool(ALLOWED_HOSTS), "ALLOWED_HOSTS is empty")
_require("*" not in ALLOWED_HOSTS, "ALLOWED_HOSTS contains a wildcard")
_require(len(SECRET_KEY) >= 50, "DJANGO_SECRET_KEY is too short")  # noqa: F405
_require(
    PASSWORD_HASHERS[0].endswith("Argon2PasswordHasher"),  # noqa: F405
    "Argon2 is not the primary password hasher",
)
_require(
    DATABASES["default"]["CONN_MAX_AGE"] == 0,  # noqa: F405
    "CONN_MAX_AGE must be 0 behind PgBouncer transaction pooling",
)
_require(
    DATABASES["default"].get("DISABLE_SERVER_SIDE_CURSORS") is True,  # noqa: F405
    "server-side cursors must be disabled behind PgBouncer transaction pooling",
)
