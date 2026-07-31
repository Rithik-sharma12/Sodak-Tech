"""Server-side permission classes.

SODAK-TECH-DESIGN.md §8.2 names the defect these guard against: "Ownership
verification on every resource fetch. Direct object reference flaws are the
most common defect in this class of platform."

Every class here implements `has_object_permission`, not just
`has_permission`. A class that only checks the latter authorises the endpoint
but not the row, which is precisely the flaw.
"""

from __future__ import annotations

from typing import Any

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import Role


class RoleAtLeast(permissions.BasePermission):
    """Grant when the caller's role meets or exceeds `required_role`.

    Subclass rather than instantiate -- DRF instantiates permission classes
    with no arguments.
    """

    required_role: str = Role.USER

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.has_role_at_least(self.required_role)
        )

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)


class IsProblemSetter(RoleAtLeast):
    required_role = Role.PROBLEM_SETTER


class IsContestManager(RoleAtLeast):
    required_role = Role.CONTEST_MANAGER


class IsAdmin(RoleAtLeast):
    required_role = Role.ADMIN


class IsSuperAdmin(RoleAtLeast):
    required_role = Role.SUPER_ADMIN


class IsOwner(permissions.BasePermission):
    """Object-level ownership, resolved through a configurable attribute.

    Set `owner_field` on the view to point at the owning user, e.g. "user" or
    "author". Defaults to "user".
    """

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        owner_field = getattr(view, "owner_field", "user")
        owner = getattr(obj, owner_field, None)
        return owner is not None and owner == request.user


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_admin:
            return True
        owner_field = getattr(view, "owner_field", "user")
        owner = getattr(obj, owner_field, None)
        return owner is not None and owner == user


class CanEditProblem(permissions.BasePermission):
    """§3.4: a Problem Setter may edit only their own problems.

    Admin and above may edit any. This is checked per problem, not per
    endpoint -- the row is what carries the ownership.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(
            user and user.is_authenticated and user.has_role_at_least(Role.PROBLEM_SETTER)
        )

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        user = request.user
        if not self.has_permission(request, view):
            return False
        if user.is_admin:
            return True
        return getattr(obj, "author_id", None) == user.pk


class CanAuthorChecker(permissions.BasePermission):
    """§8.4: custom checker authoring is restricted to Admin and above.

    The platform compiles and executes setter-supplied checker programs, which
    the design doc calls out as "an arbitrary code execution path granted to
    whoever holds problem-setter rights. [...] A Problem Setter able to author
    checkers is effectively root on the judge fleet."

    This class exists as its own name so that the restriction is greppable and
    cannot be widened by relaxing a shared permission.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.has_role_at_least(Role.ADMIN))

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)


class HasRecentReauth(permissions.BasePermission):
    """§8.3: re-authentication for destructive actions.

    Applied to role changes, deletion, contest finalization, and test data
    replacement.
    """

    message = "Re-authentication required for this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return not user.needs_reauth()

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return self.has_permission(request, view)
