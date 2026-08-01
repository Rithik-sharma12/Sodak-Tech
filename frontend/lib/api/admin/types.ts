/**
 * Admin API types.
 *
 * Mirrors backend/apps/administration/serializers.py. Field names stay
 * snake_case to match the wire format exactly — a camelCase translation layer
 * here would exist only to drift out of sync with the serializers.
 *
 * The previous version of this file described a different system: a
 * 'moderator' role that does not exist, report queues with no models behind
 * them, and a notification system that was never built. Those are gone.
 */

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Role = 'user' | 'problem_setter' | 'contest_manager' | 'admin' | 'super_admin'

export const ROLE_LABELS: Record<Role, string> = {
  user: 'User',
  problem_setter: 'Problem Setter',
  contest_manager: 'Contest Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export interface AdminUser {
  id: string
  username: string
  email: string
  display_name: string
  role: Role
  rating: number
  is_active: boolean
  created_at: string
  last_login_at: string | null
  solved_count: number
  submission_count: number
}

export interface AdminTag {
  id: number
  slug: string
  name: string
  description: string
  problem_count: number
}

export interface AdminTestCase {
  id: string
  order: number
  input_data: string
  expected_output: string
}

export interface AdminTestGroup {
  id: string
  name: string
  description: string
  weight: number
  is_sample: boolean
  order: number
  test_cases: AdminTestCase[]
}

export interface AdminProblemVersion {
  id: string
  version_number: number
  time_limit_ms: number
  memory_limit_mb: number
  comparison_mode: 'exact' | 'float' | 'checker'
  float_tolerance: number | null
  published_at: string | null
  is_published: boolean
  change_note: string
  created_at: string
  test_groups: AdminTestGroup[]
}

export interface AdminProblemSummary {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  is_public: boolean
  is_submittable: boolean
  tags: AdminTag[]
  author_username: string
  solved_count: number
  attempt_count: number
  version_count: number
  created_at: string
  updated_at: string
}

export interface AdminProblemDetail extends AdminProblemSummary {
  statement: string
  input_format: string
  output_format: string
  constraints: string
  notes: string
  row_version: number
  versions: AdminProblemVersion[]
}

/** Payload for creating a new problem version with its full test set. */
export interface VersionPayload {
  time_limit_ms: number
  memory_limit_mb: number
  comparison_mode: 'exact' | 'float' | 'checker'
  float_tolerance?: number | null
  change_note?: string
  publish: boolean
  test_groups: {
    name: string
    description?: string
    weight: number
    is_sample: boolean
    cases: { input: string; expected_output: string }[]
  }[]
}

export type ContestState =
  | 'draft'
  | 'published'
  | 'running'
  | 'frozen'
  | 'paused'
  | 'ended'
  | 'provisional'
  | 'final'

export interface AdminContest {
  id: string
  slug: string
  title: string
  description: string
  state: ContestState
  scoring_mode: 'partial' | 'icpc'
  starts_at: string
  ends_at: string
  freeze_at: string | null
  is_rated: boolean
  is_public: boolean
  owner_username: string
  problem_count: number
  registration_count: number
  created_at: string
}

export interface AdminAuditEntry {
  id: string
  action: string
  actor_label: string
  target_type: string
  target_id: string
  summary: string
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface AdminDashboard {
  users: { total: number; active: number; new_this_week: number }
  problems: { total: number; published: number; drafts: number }
  submissions: { total: number; today: number; accepted: number; pending: number }
  contests: { total: number; running: number; upcoming: number }
  verdict_breakdown: { verdict: string; count: number }[]
  recent_activity: AdminAuditEntry[]
  generated_at: string
}

export interface AdminSystemHealth {
  checks: Record<string, string>
  queue_depth: number
  judging_mode: string
  judging_warning: string
  verdict_distribution: { verdict: string; count: number }[]
  checked_at: string
}
