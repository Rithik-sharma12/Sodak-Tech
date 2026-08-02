"""Seed one production-like Two Sum problem for smoke testing.

This command creates tags, a public problem, versioned test groups, and marks
the version as published so submissions can be exercised immediately.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.problems.models import Difficulty, Problem, ProblemVersion, Tag, TestCase, TestGroup

User = get_user_model()


class Command(BaseCommand):
	help = "Seed a Two Sum problem with sample + hidden tests."

	def add_arguments(self, parser) -> None:
		parser.add_argument("--author-email", required=True)

	@transaction.atomic
	def handle(self, *args, **options) -> None:
		author_email = options["author_email"].strip().lower()
		author = User.objects.filter(email=author_email).first()
		if author is None:
			raise CommandError(f"Author not found: {author_email}")

		arrays_tag, _ = Tag.objects.get_or_create(
			slug="arrays",
			defaults={"name": "Arrays", "description": "Array and indexing techniques"},
		)
		hash_tag, _ = Tag.objects.get_or_create(
			slug="hashing",
			defaults={"name": "Hashing", "description": "Hash map based lookups"},
		)

		problem, _ = Problem.objects.get_or_create(
			slug="two-sum",
			defaults={
				"title": "Two Sum",
				"statement": (
					"Given an integer array and a target sum, return the zero-based "
					"indices of two distinct numbers that add up to the target."
				),
				"input_format": (
					"Line 1: integer n\n"
					"Line 2: n space-separated integers\n"
					"Line 3: target integer"
				),
				"output_format": (
					"Two zero-based indices in ascending order separated by one space. "
					"If no pair exists, print -1 -1."
				),
				"constraints": "1 <= n <= 2*10^5, -10^9 <= ai,target <= 10^9",
				"notes": "Expected time complexity: O(n)",
				"difficulty": Difficulty.EASY,
				"author": author,
				"is_public": True,
			},
		)
		problem.tags.set([arrays_tag, hash_tag])

		next_version = (
			ProblemVersion.objects.filter(problem=problem)
			.order_by("-version_number")
			.values_list("version_number", flat=True)
			.first()
			or 0
		) + 1

		version = ProblemVersion.objects.create(
			problem=problem,
			version_number=next_version,
			time_limit_ms=1200,
			memory_limit_mb=256,
			output_limit_kb=1024,
			comparison_mode="exact",
			language_images={
				"python": "python:3.13-slim",
				"java": "eclipse-temurin:21",
				"cpp": "gcc:14",
				"c": "gcc:14",
			},
			rubric={
				"editorial_multiplier": "0.8",
				"hint_multiplier": "0.9",
			},
			created_by=author,
			change_note="Initial public version for end-to-end validation",
			published_at=timezone.now(),
		)

		sample_group = TestGroup.objects.create(
			problem_version=version,
			name="Sample",
			description="Public sample cases shown in the statement",
			weight=20,
			is_sample=True,
			order=0,
		)
		TestCase.objects.bulk_create(
			[
				TestCase(
					test_group=sample_group,
					order=0,
					input_data="4\n2 7 11 15\n9\n",
					expected_output="0 1\n",
				),
				TestCase(
					test_group=sample_group,
					order=1,
					input_data="5\n3 2 4 9 1\n6\n",
					expected_output="1 2\n",
				),
			]
		)

		hidden_group = TestGroup.objects.create(
			problem_version=version,
			name="Hidden correctness",
			description="Edge and large-value correctness cases",
			weight=80,
			is_sample=False,
			order=1,
		)
		large_n = 12000
		large_case = f"{large_n}\n" + " ".join(["1"] * large_n) + "\n2\n"

		TestCase.objects.bulk_create(
			[
				TestCase(
					test_group=hidden_group,
					order=0,
					input_data="2\n5 5\n10\n",
					expected_output="0 1\n",
				),
				TestCase(
					test_group=hidden_group,
					order=1,
					input_data="6\n-3 4 3 90 1 5\n0\n",
					expected_output="0 2\n",
				),
				TestCase(
					test_group=hidden_group,
					order=2,
					input_data="5\n1 2 3 4 5\n100\n",
					expected_output="-1 -1\n",
				),
				TestCase(
					test_group=hidden_group,
					order=3,
					input_data=large_case,
					expected_output="0 1\n",
				),
			]
		)

		problem.current_version = version
		problem.is_public = True
		problem.save(update_fields=["current_version", "is_public", "updated_at"])

		self.stdout.write(
			self.style.SUCCESS(
				f"Seeded problem '{problem.slug}' at version {version.version_number}."
			)
		)
