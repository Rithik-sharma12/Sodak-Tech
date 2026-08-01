"""Account serializers."""

from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    """The authenticated user's own record.

    Note what is absent: `mfa_secret`, `password`, and the permission mixin's
    group/permission lists. Serialising a model with `fields = "__all__"` is
    how secrets leak, so every field here is listed deliberately.
    """

    problems_solved = serializers.SerializerMethodField()
    total_submissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "display_name", "role",
            "rating", "peak_rating", "rated_contest_count",
            "problems_solved", "total_submissions", "created_at",
        ]
        read_only_fields = ["id", "role", "rating", "peak_rating", "created_at"]

    def get_problems_solved(self, obj: User) -> int:
        return self.context.get("problems_solved", 0)

    def get_total_submissions(self, obj: User) -> int:
        return self.context.get("total_submissions", 0)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"],
            password=attrs["password"],
        )
        # One message for both "no such user" and "wrong password". Telling the
        # two apart turns the login form into an account-existence oracle.
        if user is None:
            raise serializers.ValidationError("Incorrect email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs
