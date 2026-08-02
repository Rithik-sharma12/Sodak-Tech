/**
 * Types mirroring the API's serializers.
 *
 * Hand-written rather than generated, and deliberately narrow: the backend
 * publishes an OpenAPI schema at /api/schema/, so if these drift far enough to
 * matter, regenerate from there rather than widening them to `any`.
 *
 * Verdicts and states are unions rather than `string` on purpose. There are a
 * dozen verdicts and several progress states, and a typo in one of them is
 * otherwise a runtime bug that only shows up on the one submission that hits
 * that branch.
 */

export type Role =
  | "user"
  | "problem_setter"
  | "contest_manager"
  | "admin"
  | "super_admin";

export const PRIVILEGED_ROLES: Role[] = [
  "problem_setter",
  "contest_manager",
  "admin",
  "super_admin",
];

export type Difficulty = "easy" | "medium" | "hard";

export type ProgressState = "not_attempted" | "attempted" | "solved" | "mastered";

export type Verdict =
  | "pending"
  | "queued"
  | "compiling"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "runtime_error"
  | "compile_error"
  | "presentation_error"
  | "sandbox_violation"
  | "internal_error"
  | "cancelled";

/** Verdicts after which nothing more will change. */
export const TERMINAL_VERDICTS: Verdict[] = [
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "output_limit_exceeded",
  "runtime_error",
  "compile_error",
  "presentation_error",
  "sandbox_violation",
  "internal_error",
  "cancelled",
];

export function isTerminal(verdict: Verdict): boolean {
  return TERMINAL_VERDICTS.includes(verdict);
}

export type ContestState =
  | "draft"
  | "published"
  | "running"
  | "frozen"
  | "ended"
  | "finalised"
  | "cancelled";

export type SubmissionKind = "run" | "submit";

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: Role;
  rating: number;
  peak_rating: number;
  rated_contest_count: number;
  problems_solved: number;
  total_submissions: number;
  created_at: string;
}

export interface Tag {
  slug: string;
  name: string;
}

export interface LanguageOption {
  id: string;
  name: string;
  version: string;
  monaco: string;
}

export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: Tag[];
  acceptance_rate: number;
  solved_count: number;
  attempt_count: number;
  progress_state: ProgressState;
}

export interface Example {
  input: string;
  output: string;
  explanation: string;
}

export interface ProblemDetail extends ProblemSummary {
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  notes: string;
  examples: Example[];
  time_limit_ms: number;
  memory_limit_mb: number;
  problem_version_id: string;
  editorial_unlocked: boolean;
  languages: LanguageOption[];
}

export interface CaseResult {
  case_number: number;
  input: string;
  expected: string;
  actual: string;
  stderr?: string;
  status: Verdict;
  runtime: number;
  memory: number;
}

export interface GroupResult {
  test_group_name: string;
  verdict: Verdict;
  passed: boolean;
  cases_total: number;
  cases_passed: number;
  weight: number;
  max_runtime_ms: number;
  max_memory_kb: number | null;
  first_failing_case_index: number | null;
  /** Populated for sample groups only; hidden groups never expose case data. */
  case_results: CaseResult[];
}

export interface Submission {
  id: string;
  problem_slug: string;
  problem_title: string;
  language: string;
  verdict: Verdict;
  score: string;
  max_runtime_ms: number | null;
  max_memory_kb: number | null;
  received_at: string;
  judged_at: string | null;
  kind: SubmissionKind;
  compile_output: string;
  results: GroupResult[];
}

export interface SubmissionStatus {
  id: string;
  verdict: Verdict;
  score: string;
  is_terminal: boolean;
}

export interface ProgressSummary {
  problems_solved: number;
  problems_attempted: number;
  acceptance_rate: number;
  current_streak: number;
  total_submissions: number;
  by_difficulty: Record<Difficulty, { solved: number; total: number }>;
  by_tag: { tag: string; solved: number; total: number; mastery: boolean }[];
  activity: { date: string; count: number }[];
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  score: number;
  problems_solved: number;
  is_current_user: boolean;
}

export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string;
  state: ContestState;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  is_rated: boolean;
  problem_count: number;
  participant_count: number;
  registered: boolean;
  /** Server-side gate: problems stay unreadable until the contest starts. */
  problems_readable: boolean;
  server_time?: string;
}

export interface ContestList {
  /**
   * Countdowns are derived from this, never from the browser clock (§7.2) --
   * a wrong or deliberately altered client clock must not change what the
   * contest does.
   */
  server_time: string;
  results: Contest[];
}

/* -------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------- */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: Role;
  rating: number;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  solved_count: number;
  submission_count: number;
}

export interface AdminTag extends Tag {
  id: number;
  description: string;
  problem_count: number;
}

export interface AdminTestCase {
  id?: string;
  order?: number;
  input_data: string;
  expected_output: string;
}

export interface AdminTestGroup {
  id?: string;
  name: string;
  description: string;
  weight: number;
  is_sample: boolean;
  order?: number;
  test_cases: AdminTestCase[];
}

export interface AdminProblemVersion {
  id: string;
  version_number: number;
  time_limit_ms: number;
  memory_limit_mb: number;
  comparison_mode: "exact" | "float" | "checker";
  float_tolerance: number | null;
  published_at: string | null;
  is_published: boolean;
  change_note: string;
  created_at: string;
  test_groups: AdminTestGroup[];
}

export interface AdminProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  is_public: boolean;
  /** True once a version is published; until then the problem cannot be solved. */
  is_submittable: boolean;
  tags: AdminTag[];
  author_username: string;
  solved_count: number;
  attempt_count: number;
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminProblemDetail extends AdminProblemSummary {
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  notes: string;
  /** Optimistic concurrency token; echo it back on update (§7.3). */
  row_version: number;
  versions: AdminProblemVersion[];
}

export interface AdminContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  state: ContestState;
  scoring_mode: string;
  starts_at: string;
  ends_at: string;
  freeze_at: string | null;
  is_rated: boolean;
  is_public: boolean;
  owner_username: string;
  problem_count: number;
  registration_count: number;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor_label: string;
  target_type: string;
  target_id: string;
  summary: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AdminDashboard {
  users: { total: number; active: number; new_this_week: number };
  problems: { total: number; published: number; drafts: number };
  submissions: { total: number; today: number; accepted: number; pending: number };
  contests: { total: number; running: number; upcoming: number };
  verdict_breakdown: { verdict: Verdict; count: number }[];
  recent_activity: AuditEntry[];
  generated_at: string;
}

export interface SystemHealth {
  checks: Record<string, string>;
  queue_depth: number;
  judging_mode: string;
  judging_warning?: string;
  sandbox?: { available: boolean; image?: string; detail?: string };
  verdict_distribution: { verdict: Verdict; count: number }[];
  checked_at: string;
}

/* -------------------------------------------------------------------------
 * Pagination
 * ---------------------------------------------------------------------- */

export interface Paginated<T> {
  count?: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
