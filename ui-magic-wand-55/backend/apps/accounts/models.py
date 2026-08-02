"""Identity, roles, and rating.

The role model is SODAK-TECH-DESIGN.md §3.4. Roles are ordered by capability
and checked server-side per resource -- §3.4 closes with "Hiding a control in
the UI is not access control", and §5.2 of the stack doc repeats it: "The admin
interface is client code; anyone holding a privileged token can call the API
directly."
"""

from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import SoftDeleteModel, TimestampedModel, UUIDPrimaryKeyModel


class Role(models.TextChoices):
    """Capability tiers, ordered least to most privileged.

    Ordering is meaningful: `Role.rank()` powers "this role or above" checks.
    """

    USER = "user", _("User")
    PROBLEM_SETTER = "problem_setter", _("Problem Setter")
    CONTEST_MANAGER = "contest_manager", _("Contest Manager")
    ADMIN = "admin", _("Admin")
    SUPER_ADMIN = "super_admin", _("Super Admin")

    @classmethod
    def rank(cls, role: str) -> int:
        order = [cls.USER, cls.PROBLEM_SETTER, cls.CONTEST_MANAGER, cls.ADMIN, cls.SUPER_ADMIN]
        return order.index(role)  # type: ignore[arg-type]

    @classmethod
    def privileged(cls) -> set[str]:
        """Roles that require MFA and a shortened session (§8.3)."""
        return {cls.PROBLEM_SETTER, cls.CONTEST_MANAGER, cls.ADMIN, cls.SUPER_ADMIN}


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def _create(self, email: str, username: str, password: str | None, **extra: Any) -> User:
        if not email:
            raise ValueError("An email address is required.")
        if not username:
            raise ValueError("A username is required.")
        user = self.model(email=self.normalize_email(email), username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, username: str, password: str | None = None,
                    **extra: Any) -> User:
        extra.setdefault("role", Role.USER)
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, username, password, **extra)

    def create_superuser(self, email: str, username: str, password: str | None = None,
                         **extra: Any) -> User:
        extra.setdefault("role", Role.SUPER_ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_active", True)
        if extra["role"] != Role.SUPER_ADMIN:
            raise ValueError("A superuser must have role=super_admin.")
        return self._create(email, username, password, **extra)


class User(UUIDPrimaryKeyModel, AbstractBaseUser, PermissionsMixin, TimestampedModel,
           SoftDeleteModel):
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=32, unique=True, db_index=True)
    display_name = models.CharField(max_length=64, blank=True)

    role = models.CharField(
        max_length=32, choices=Role.choices, default=Role.USER, db_index=True
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # §8.3: MFA is enforced, not optional, for Admin and above. `has_mfa` gates
    # login for privileged roles -- see `requires_mfa`.
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=128, blank=True)

    # §3 of the design doc: rating is the primary progression signal, and §8.5
    # notes it is therefore the primary target for manipulation.
    rating = models.IntegerField(default=1200, db_index=True)
    peak_rating = models.IntegerField(default=1200)
    rated_contest_count = models.PositiveIntegerField(default=0)

    last_login_at = models.DateTimeField(null=True, blank=True)
    last_reauth_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()  # type: ignore[assignment,misc]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["-rating"]),
        ]

    def __str__(self) -> str:
        return self.display_name or self.username

    # ------------------------------------------------------------------
    # Role checks
    # ------------------------------------------------------------------

    def has_role_at_least(self, role: str) -> bool:
        return Role.rank(self.role) >= Role.rank(role)

    @property
    def is_admin(self) -> bool:
        return self.has_role_at_least(Role.ADMIN)

    @property
    def is_super_admin(self) -> bool:
        return self.role == Role.SUPER_ADMIN

    @property
    def requires_mfa(self) -> bool:
        """§8.3: MFA enforced for privileged roles, not offered."""
        return self.role in Role.privileged()

    @property
    def session_max_age(self) -> int:
        """§8.3: privileged sessions are shorter than learner sessions."""
        from django.conf import settings

        if self.role in Role.privileged():
            return settings.PRIVILEGED_SESSION_COOKIE_AGE
        return settings.SESSION_COOKIE_AGE

    def needs_reauth(self) -> bool:
        """§8.3: destructive actions require recent re-authentication."""
        from django.conf import settings

        if self.last_reauth_at is None:
            return True
        age = (timezone.now() - self.last_reauth_at).total_seconds()
        return age > settings.REAUTH_WINDOW_SECONDS

    # ------------------------------------------------------------------
    # Guardrails
    # ------------------------------------------------------------------

    def can_assign_role(self, target: User, new_role: str) -> bool:
        """§7.3: "Users cannot modify their own role under any circumstances."

        Only Super Admin assigns roles at all (§3.4 denies it to Admin), and
        never to themselves -- self-elevation is the escalation path this
        closes.
        """
        if self.pk == target.pk:
            return False
        if not self.is_super_admin:
            return False
        return new_role in Role.values
