"""Prepare a fresh installation.

Creates the first Super Admin and nothing else. No sample problems, no demo
users, no placeholder contests — an Alpha shown to a client should contain only
what the client puts in it.

    python manage.py bootstrap --email admin@example.com --username admin

The password is read from the SODAK_ADMIN_PASSWORD environment variable, or
generated and printed once if unset. It is never taken as a command-line
argument, because arguments land in shell history and in the process list where
any other user on the box can read them.
"""

from __future__ import annotations

import os
import secrets

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import Role
from apps.audit.models import AuditAction, AuditLog

User = get_user_model()


class Command(BaseCommand):
    help = "Create the initial Super Admin account on a fresh installation."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--email", required=True)
        parser.add_argument("--username", required=True)
        parser.add_argument(
            "--display-name",
            default="",
            help="Optional human-readable name shown in the UI.",
        )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        email = options["email"].strip().lower()
        username = options["username"].strip()

        if User.all_objects.filter(email=email).exists():
            raise CommandError(f"A user with email {email} already exists.")
        if User.all_objects.filter(username=username).exists():
            raise CommandError(f"A user with username {username} already exists.")

        password = os.environ.get("SODAK_ADMIN_PASSWORD")
        generated = False
        if not password:
            # URL-safe alphabet: no characters that Compose, shells, or CI will
            # reinterpret. Same reasoning as the secret key in .env.example.
            password = secrets.token_urlsafe(18)
            generated = True

        try:
            validate_password(password)
        except ValidationError as exc:
            raise CommandError(
                "Password rejected: " + "; ".join(exc.messages)
            ) from exc

        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            display_name=options["display_name"] or username,
            role=Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        AuditLog.objects.record(
            action=AuditAction.USER_ROLE_CHANGED,
            actor=None,
            target_type="user",
            target_id=str(user.pk),
            summary=f"Bootstrap created Super Admin {username}",
            metadata={"bootstrap": True, "role": Role.SUPER_ADMIN},
        )

        self.stdout.write(self.style.SUCCESS(f"\nSuper Admin created: {username} <{email}>"))

        if generated:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("  Generated password (shown once):"))
            self.stdout.write(self.style.WARNING(f"      {password}"))
            self.stdout.write("")
            self.stdout.write("  Store it now — it cannot be recovered, only reset.")

        self.stdout.write(
            "\nNext: sign in and add problems from the admin panel at /admin/problems.\n"
            "A problem becomes solvable once a version with test groups is published.\n"
        )

        # §8.3 requires MFA for Admin and above. It is not implemented yet, so
        # say so here rather than let a deployment assume it is on.
        self.stdout.write(
            self.style.WARNING(
                "  Note: multi-factor authentication is not implemented yet. "
                "Design doc §8.3 requires it for admin roles before public launch."
            )
        )
