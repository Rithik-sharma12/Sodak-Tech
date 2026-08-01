"""Local development settings.

Never import this from a deployed environment. prod.py asserts the hardening
that this file deliberately relaxes.
"""

from .base import *  # noqa: F403
from .base import env

DEBUG = True

# Loopback plus whatever DJANGO_ALLOWED_HOSTS adds, so a LAN address can be
# appended for testing from a phone or another machine without editing code.
# prod.py deliberately does not do this -- there the list comes from the
# environment alone and an empty one refuses to start.
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",  # noqa: S104
    "api",
    "testserver",
    *env.list("DJANGO_ALLOWED_HOSTS", default=[]),
]

# The Next.js dev server.
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000"],
)

# Plain HTTP locally.
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

# Surface the browsable API for manual exploration.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# Faster tests -- Argon2 is deliberately slow and dominates test runtime.
if env.bool("USE_FAST_HASHING", default=False):
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]  # noqa: S105
