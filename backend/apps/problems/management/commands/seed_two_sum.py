"""Seed one production-like Two Sum problem for smoke testing.

This command creates tags, a public problem, versioned test groups, and marks
the version as published so submissions can be exercised immediately.

The problem is judge_mode="signature": learners submit only the `twoSum`
function and the judge merges it into a setter-authored driver that handles the
stdin/stdout contract. `signature_templates` carry the per-language (starter,
driver) pairs, so this one file is the whole authoring story.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.problems.models import (
    Difficulty,
    JudgingMode,
    Problem,
    ProblemVersion,
    Tag,
    TestCase,
    TestGroup,
)

User = get_user_model()

# Placeholder where the submitted source is injected into the driver. Kept in
# sync with apps/judging/local_judge.py -- the judge errors out loudly if a
# driver loses the marker, so a mismatch cannot silently judge the wrong thing.
USER_CODE_MARKER = "%%USER_CODE%%"


def _template(starter: str, driver: str) -> dict[str, str]:
    """A (starter, driver) pair for one language."""
    if USER_CODE_MARKER not in driver:
        raise ValueError(f"Driver template must contain {USER_CODE_MARKER!r}.")
    return {"starter": starter, "driver": driver}


PYTHON = _template(
    starter='''def twoSum(nums: list[int], target: int) -> list[int]:
    """Return the zero-based indices of two numbers that add up to target.

    If no such pair exists, return an empty list.
    """
    ...
''',
    driver='''import sys


%%USER_CODE%%


def main() -> None:
    data = sys.stdin.read().split()
    idx = 0
    n = int(data[idx])
    idx += 1
    nums = [int(data[i]) for i in range(idx, idx + n)]
    idx += n
    target = int(data[idx])

    result = twoSum(nums, target)
    if not result:
        result = [-1, -1]
    print(" ".join(str(x) for x in result))


main()
''',
)

CPP = _template(
    starter='''#include <bits/stdc++.h>
using namespace std;

// Return the zero-based indices of the two numbers that add up to target.
// If no such pair exists, return an empty vector.
vector<int> twoSum(vector<int>& nums, int target) {
    // TODO: implement
    return {};
}
''',
    driver='''#include <bits/stdc++.h>
using namespace std;

%%USER_CODE%%


int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];
    int target;
    cin >> target;

    vector<int> result = twoSum(nums, target);
    if (result.empty()) {
        cout << "-1 -1\\n";
    } else {
        for (size_t i = 0; i < result.size(); ++i) {
            if (i) cout << ' ';
            cout << result[i];
        }
        cout << '\\n';
    }
    return 0;
}
''',
)

C = _template(
    starter='''#include <stdio.h>

// Return 1 and set result[0] and result[1] to the zero-based indices of two
// numbers that add up to target. Return 0 if no such pair exists.
int twoSum(int* nums, int n, int target, int* result) {
    // TODO: implement
    (void)nums;
    (void)n;
    (void)target;
    (void)result;
    return 0;
}
''',
    driver='''#include <stdio.h>
#include <stdlib.h>

%%USER_CODE%%


int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 1;

    int* nums = (int*)malloc((size_t)n * sizeof(int));
    if (nums == NULL) return 1;
    for (int i = 0; i < n; ++i) {
        if (scanf("%d", &nums[i]) != 1) {
            free(nums);
            return 1;
        }
    }

    int target;
    if (scanf("%d", &target) != 1) {
        free(nums);
        return 1;
    }

    int result[2];
    if (twoSum(nums, n, target, result)) {
        printf("%d %d\\n", result[0], result[1]);
    } else {
        printf("-1 -1\\n");
    }

    free(nums);
    return 0;
}
''',
)

JAVA = _template(
    starter='''import java.util.*;

class Solution {
    // Return the zero-based indices of the two numbers that add up to target.
    // If no such pair exists, return null.
    public int[] twoSum(int[] nums, int target) {
        // TODO: implement
        return null;
    }
}
''',
    driver='''import java.io.*;
import java.util.*;

%%USER_CODE%%


public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        int n = Integer.parseInt(in.readLine().trim());
        int[] nums = new int[n];
        StringTokenizer st = new StringTokenizer(in.readLine());
        for (int i = 0; i < n; i++) {
            nums[i] = Integer.parseInt(st.nextToken());
        }
        int target = Integer.parseInt(in.readLine().trim());

        int[] result = new Solution().twoSum(nums, target);
        if (result == null) {
            System.out.println("-1 -1");
        } else {
            System.out.println(result[0] + " " + result[1]);
        }
    }
}
''',
)


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
					"indices of two distinct numbers that add up to the target.\n\n"
					"Implement the function `twoSum(nums, target)`. The judge reads "
					"the test input, calls your function, and compares the indices "
					"it returns against the expected answer — no input parsing, no "
					"printing.\n\n"
					"If no such pair exists, return an empty result "
					"(`[]`, `{}`, `null`; return `0` in C)."
				),
				# The test data the driver parses. Documented for the problem
				# author, not rendered to learners in signature mode.
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
			judge_mode=JudgingMode.SIGNATURE,
			signature_templates={
				"python": PYTHON,
				"cpp": CPP,
				"c": C,
				"java": JAVA,
			},
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
