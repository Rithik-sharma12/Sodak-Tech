/**
 * Translation between the API's wire format and the UI's types.
 *
 * The two disagree on shape, and deliberately so:
 *   API                    UI
 *   'easy'                 'Easy'
 *   'wrong_answer'         'Wrong Answer'
 *   'problem_setter'       'Problem Setter'
 *   constraints: string    constraints: string[]
 *
 * Everything that reconciles them lives in this one file. The alternative —
 * changing the UI's types — would mean editing all 17 views, and would leave the
 * display strings ('Wrong Answer') coupled to the server's enum values, so a
 * future backend rename would ripple through the whole interface.
 *
 * Unknown values fall back to something safe rather than throwing. A verdict the
 * client has not been taught about should render as Pending, not crash the page.
 */

import type {
  Difficulty,
  ProgrammingLanguage,
  Problem,
  Role,
  Submission,
  TestCase,
  UserProfile,
  Verdict,
} from '../types'

type Json = Record<string, unknown>

const str = (v: unknown, fallback = ''): string => (v == null ? fallback : String(v))
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const DIFFICULTY: Record<string, Difficulty> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const toDifficulty = (v: unknown): Difficulty => DIFFICULTY[str(v).toLowerCase()] || 'Easy'

export const fromDifficulty = (d: Difficulty): string => d.toLowerCase()

const VERDICT: Record<string, Verdict> = {
  accepted: 'Accepted',
  wrong_answer: 'Wrong Answer',
  time_limit_exceeded: 'Time Limit Exceeded',
  memory_limit_exceeded: 'Memory Limit Exceeded',
  output_limit_exceeded: 'Wrong Answer',
  compile_error: 'Compilation Error',
  presentation_error: 'Wrong Answer',
  runtime_error: 'Wrong Answer',
  // The sandbox stopped it — distinct from the program failing on its own, but
  // the UI has no separate badge for it yet.
  sandbox_violation: 'Wrong Answer',
  internal_error: 'Pending',
  cancelled: 'Pending',
  pending: 'Pending',
  queued: 'Pending',
  compiling: 'Pending',
  running: 'Pending',
}

export const toVerdict = (v: unknown): Verdict => VERDICT[str(v).toLowerCase()] || 'Pending'

const ROLE: Record<string, Role> = {
  user: 'Student',
  problem_setter: 'Problem Setter',
  contest_manager: 'Contest Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export const toRole = (v: unknown): Role => ROLE[str(v).toLowerCase()] || 'Student'

export const fromRole = (r: Role): string =>
  (Object.entries(ROLE).find(([, label]) => label === r)?.[0] as string) || 'user'

/** Roles that may see the admin area. Rendering only — the server re-checks. */
export const isPrivileged = (r: Role): boolean => r !== 'Student'

const LANGUAGES: ProgrammingLanguage[] = ['python', 'cpp', 'java', 'javascript', 'go', 'rust']

export const toLanguage = (v: unknown): ProgrammingLanguage => {
  const s = str(v).toLowerCase()
  return (LANGUAGES.find((l) => l === s) as ProgrammingLanguage) || 'python'
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

const EMPTY_TEMPLATES: Record<ProgrammingLanguage, string> = {
  python: '',
  cpp: '',
  java: '',
  javascript: '',
  go: '',
  rust: '',
}

/**
 * Starter templates are not modelled on the backend yet, so they are generated
 * here rather than invented per problem. When the backend gains them, this
 * function is the only place to change.
 */
function starterTemplates(): Record<ProgrammingLanguage, string> {
  return {
    ...EMPTY_TEMPLATES,
    python: '# Read from stdin, write to stdout.\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n    }\n}\n',
    javascript: '// Read from stdin, write to stdout.\n',
    go: 'package main\n\nfunc main() {\n}\n',
    rust: 'fn main() {\n}\n',
  }
}

export function toTestCase(raw: Json, index: number): TestCase {
  return {
    id: str(raw.id, `case-${index}`),
    input: str(raw.input_data ?? raw.input),
    expectedOutput: str(raw.expected_output),
    isSample: Boolean(raw.is_sample ?? true),
    explanation: raw.explanation ? str(raw.explanation) : undefined,
  }
}

export function toProblem(raw: Json): Problem {
  // Sample cases arrive nested inside their groups. §8.1 guarantees only
  // is_sample groups are ever serialised to a learner, so anything present here
  // is safe to display.
  const groups = (raw.sample_groups ?? raw.test_groups ?? []) as Json[]
  const sampleCases: TestCase[] = []
  groups.forEach((g) => {
    const cases = (g.test_cases ?? g.cases ?? []) as Json[]
    cases.forEach((c, i) => sampleCases.push(toTestCase(c, sampleCases.length + i)))
  })

  const tags = (raw.tags ?? []) as Json[]

  return {
    id: str(raw.slug ?? raw.id),
    slug: str(raw.slug),
    title: str(raw.title, 'Untitled'),
    difficulty: toDifficulty(raw.difficulty),
    acceptanceRate: num(raw.acceptance_rate) * (num(raw.acceptance_rate) <= 1 ? 100 : 1),
    solvedCount: num(raw.solved_count),
    totalSubmissions: num(raw.attempt_count ?? raw.total_submissions),
    timeLimit: `${(num(raw.time_limit_ms, 1000) / 1000).toFixed(1)}s`,
    memoryLimit: `${num(raw.memory_limit_mb, 256)}MB`,
    topics: tags.map((t) => str(t.name ?? t.slug ?? t)),
    description: str(raw.statement),
    inputFormat: str(raw.input_format),
    outputFormat: str(raw.output_format),
    // The API stores constraints as one block; the UI renders a list.
    constraints: str(raw.constraints)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
    sampleCases,
    starterTemplates: starterTemplates(),
    author: raw.author_username ? str(raw.author_username) : undefined,
    isPublished: Boolean(raw.is_submittable ?? raw.is_public),
  }
}

export function toSubmission(raw: Json, fallbackTitle = ''): Submission {
  const results = (raw.results ?? []) as Json[]
  const passed = results.filter((r) => Boolean(r.passed)).length

  return {
    id: str(raw.id),
    problemId: str(raw.problem_slug ?? raw.problem),
    problemTitle: str(raw.problem_title, fallbackTitle),
    difficulty: toDifficulty(raw.difficulty),
    userId: str(raw.user_id ?? raw.user),
    userName: str(raw.user_display_name ?? raw.username),
    userHandle: str(raw.username),
    language: toLanguage(raw.language),
    code: str(raw.source_code),
    verdict: toVerdict(raw.verdict),
    runtimeMs: num(raw.max_runtime_ms),
    memoryMb: Math.round(num(raw.max_memory_kb) / 1024),
    // Test *groups*, not individual cases — this platform scores per weighted
    // group, and the group is the unit a user can act on.
    passedTests: passed,
    totalTests: results.length,
    submittedAt: str(raw.received_at ?? raw.created_at),
    score: raw.score != null ? num(raw.score) : undefined,
    testDetails: results.map((r, i) => ({
      caseNumber: i + 1,
      input: str(r.test_group_name),
      expected: '',
      actual: '',
      passed: Boolean(r.passed),
      runtimeMs: num(r.max_runtime_ms),
    })),
  } as Submission
}

/**
 * Merge API user fields into the UI's UserProfile.
 *
 * `base` supplies the shape for everything the API does not yet return —
 * topicMastery, activityHeatmap, per-difficulty totals. Those come from the
 * progress endpoint or are not modelled at all, and passing the existing
 * profile through keeps the object structurally complete so views that reach
 * into `problemsSolved.easy` do not blow up on undefined.
 */
export function toUserProfile(raw: Json, base?: UserProfile): UserProfile {
  const solved = (raw.problems_solved ?? {}) as Json
  const solvedIsObject = typeof raw.problems_solved === 'object' && raw.problems_solved !== null

  return {
    ...(base as UserProfile),
    id: str(raw.id, base?.id ?? ''),
    name: str(raw.display_name ?? raw.username, base?.name ?? 'User'),
    handle: str(raw.username, base?.handle ?? ''),
    email: str(raw.email, base?.email ?? ''),
    role: toRole(raw.role),
    avatarUrl: str(raw.avatar_url, base?.avatarUrl ?? ''),
    bio: str(raw.bio, base?.bio ?? ''),
    rating: num(raw.rating, base?.rating ?? 1200),
    peakRating: num(raw.peak_rating, base?.peakRating ?? num(raw.rating, 1200)),
    globalRank: num(raw.global_rank, base?.globalRank ?? 0),
    streakDays: num(raw.current_streak, base?.streakDays ?? 0),
    joinedDate: str(raw.created_at ?? raw.joined_at, base?.joinedDate ?? ''),
    problemsSolved: solvedIsObject
      ? {
          easy: num(solved.easy),
          totalEasy: num(solved.total_easy, base?.problemsSolved?.totalEasy ?? 0),
          medium: num(solved.medium),
          totalMedium: num(solved.total_medium, base?.problemsSolved?.totalMedium ?? 0),
          hard: num(solved.hard),
          totalHard: num(solved.total_hard, base?.problemsSolved?.totalHard ?? 0),
        }
      : (base?.problemsSolved ?? {
          easy: 0,
          totalEasy: 0,
          medium: 0,
          totalMedium: 0,
          hard: 0,
          totalHard: 0,
        }),
  } as UserProfile
}
