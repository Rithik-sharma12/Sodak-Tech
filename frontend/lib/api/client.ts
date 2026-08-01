/**
 * Real API client for the Django backend.
 *
 * This is an adapter, deliberately. The backend speaks DRF conventions
 * (snake_case, trailing slashes, cursor/page envelopes); the components were
 * written against camelCase shapes. Rather than churn every component or
 * distort the Django serializers, the mapping lives here — one file to change
 * when either side moves.
 *
 * Two things the generated client was missing that session auth cannot work
 * without:
 *
 *   credentials: 'include'  — the session cookie is never sent otherwise, so
 *                             every authenticated request 403s.
 *   X-CSRFToken header      — Django rejects unsafe methods without it.
 *
 * Trailing slashes are also mandatory: Django's APPEND_SLASH issues a 301 for
 * a missing one, and browsers drop the body when following a redirect, so a
 * POST silently arrives empty.
 */

import type {
  Contest,
  ExecutionResult,
  LeaderboardEntry,
  Problem,
  ProgrammingLanguage,
  Submission,
  TestCaseResult,
  User,
  VerdictStatus,
} from './types'

/**
 * Where the Django API lives.
 *
 * Derived from the host the page was opened on rather than hardcoded, so one
 * build works at http://localhost:3000 and at http://<lan-ip>:3000 with no env
 * swap.
 *
 * This is not cosmetic. Session cookies are SameSite=Lax, and browsers treat
 * `localhost` and an IP address as different *sites* — a page served from the
 * LAN IP talking to a `localhost` API would silently drop the session cookie
 * and 403 on every authenticated request. Following the page's own hostname
 * keeps them same-site whichever way the app is reached. (Ports do not affect
 * site, so :3000 → :8000 is fine.)
 *
 * NEXT_PUBLIC_DJANGO_API_URL still wins when set, for deployments where the
 * API lives on a different host entirely.
 */
const API_PORT = process.env.NEXT_PUBLIC_DJANGO_API_PORT || '8000'

function resolveApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_DJANGO_API_URL
  if (explicit) return explicit
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}/api/v1`
  }
  // Server-render pass has no window to read. Components fetch on the client,
  // so this is only a placeholder.
  return `http://localhost:${API_PORT}/api/v1`
}

const API_BASE = resolveApiBase()

// ---------------------------------------------------------------------------
// CSRF
// ---------------------------------------------------------------------------

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[2]) : null
}

let csrfPrimed = false

/** Ask Django to set the csrftoken cookie. Called once before the first write. */
async function primeCsrf(): Promise<void> {
  if (csrfPrimed || readCookie('csrftoken')) {
    csrfPrimed = true
    return
  }
  try {
    await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' })
    csrfPrimed = true
  } catch {
    // Leave unprimed; the write will fail loudly rather than silently.
  }
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  if (isWrite) await primeCsrf()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (isWrite) {
    const token = readCookie('csrftoken')
    if (token) headers['X-CSRFToken'] = token
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include', // without this the session cookie never travels
  })

  if (response.status === 204) return undefined as T

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const detail =
      (body && (body.detail || body.error)) || `${response.status} ${response.statusText}`
    throw new ApiError(response.status, detail, body)
  }

  return body as T
}

// ---------------------------------------------------------------------------
// Mapping: Django payloads -> the shapes components already expect
// ---------------------------------------------------------------------------

interface DjangoTag {
  slug: string
  name: string
}

interface DjangoProblem {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: DjangoTag[]
  acceptance_rate: number
  solved_count: number
  attempt_count: number
  progress_state: string
  statement?: string
  input_format?: string
  output_format?: string
  constraints?: string
  notes?: string
  examples?: { input: string; output: string; explanation?: string }[]
  time_limit_ms?: number
  memory_limit_mb?: number
  editorial_unlocked?: boolean
}

function toProblem(p: DjangoProblem): Problem {
  const sections = [p.statement]
  if (p.input_format) sections.push(`\n\n**Input**\n\n${p.input_format}`)
  if (p.output_format) sections.push(`\n\n**Output**\n\n${p.output_format}`)
  if (p.notes) sections.push(`\n\n**Notes**\n\n${p.notes}`)

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    description: sections.filter(Boolean).join(''),
    // Django stores constraints as one text block; the UI renders a list.
    constraints: (p.constraints || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    examples: (p.examples || []).map((ex, index) => ({
      id: `${p.slug}-example-${index}`,
      input: ex.input,
      output: ex.output,
      isExample: true,
    })),
    acceptanceRate: p.acceptance_rate ?? 0,
    tags: (p.tags || []).map((t) => t.name),
    totalSubmissions: p.attempt_count ?? 0,
    acceptedSubmissions: p.solved_count ?? 0,
  }
}

interface DjangoSubmissionResult {
  test_group_name: string
  verdict: VerdictStatus
  passed: boolean
  cases_total: number
  cases_passed: number
  weight: number
  max_runtime_ms: number | null
  max_memory_kb: number | null
  first_failing_case_index: number | null
  case_results: {
    case_number: number
    input: string
    expected: string
    actual: string
    status: string
    runtime: number
    memory: number
  }[]
}

interface DjangoSubmission {
  id: string
  problem_slug: string
  problem_title: string
  language: string
  verdict: VerdictStatus
  score: string
  max_runtime_ms: number | null
  max_memory_kb: number | null
  received_at: string
  judged_at: string | null
  kind: string
  compile_output: string
  results: DjangoSubmissionResult[]
}

function toSubmission(s: DjangoSubmission): Submission {
  return {
    id: s.id,
    problemId: s.problem_slug,
    userId: '',
    code: '',
    language: s.language as ProgrammingLanguage,
    verdict: s.verdict,
    runtime: s.max_runtime_ms ?? 0,
    memory: s.max_memory_kb ? Math.round(s.max_memory_kb / 1024) : 0,
    createdAt: s.received_at,
    output: s.compile_output || undefined,
  }
}

/**
 * Flatten a judged submission into the editor's results panel shape.
 *
 * Only sample groups carry `case_results` — the backend withholds hidden-group
 * detail (§8.1) and withholds all case detail for contest submissions (§8.5).
 * An empty array here is that policy working, not a bug.
 */
function toExecutionResult(s: DjangoSubmission): ExecutionResult {
  const testCases: TestCaseResult[] = []

  s.results.forEach((group, groupIndex) => {
    group.case_results.forEach((c) => {
      testCases.push({
        id: `${s.id}-${groupIndex}-${c.case_number}`,
        caseNumber: c.case_number,
        input: c.input,
        expected: c.expected,
        actual: c.actual,
        status: (c.status === 'accepted'
          ? 'accepted'
          : c.status === 'time_limit_exceeded'
            ? 'time_limit_exceeded'
            : c.status === 'runtime_error'
              ? 'runtime_error'
              : 'wrong_answer') as TestCaseResult['status'],
        runtime: c.runtime,
        memory: c.memory,
      })
    })
  })

  const hiddenSummary = s.results
    .filter((g) => g.case_results.length === 0)
    .map((g) => `${g.passed ? 'PASS' : 'FAIL'}  ${g.test_group_name} (weight ${g.weight})`)
    .join('\n')

  const header =
    s.verdict === 'accepted'
      ? `Accepted — score ${s.score}`
      : `${s.verdict.replace(/_/g, ' ')} — score ${s.score}`

  return {
    verdict: s.verdict,
    runtime: s.max_runtime_ms ?? 0,
    memory: s.max_memory_kb ? Math.round(s.max_memory_kb / 1024) : 0,
    output: [header, s.compile_output, hiddenSummary].filter(Boolean).join('\n\n'),
    testCases,
  }
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/**
 * Verb helpers over `request`, for callers that need the raw endpoint rather
 * than one of the typed domain methods below. The admin client is built on
 * these so it shares one transport — CSRF priming, credentials, and error
 * shaping all stay in a single place.
 */
export const http = {
  get: <T>(path: string, params?: Record<string, unknown>): Promise<T> => {
    const query = params
      ? Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : ''
    return request<T>(`${path}${query ? `?${query}` : ''}`)
  },
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
}

export const apiClient = {
  // --- auth ---

  async login(email: string, password: string): Promise<User> {
    const u = await request<Record<string, unknown>>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return mapUser(u)
  },

  async logout(): Promise<void> {
    await request<void>('/auth/logout/', { method: 'POST' })
  },

  async getCurrentUser(): Promise<User> {
    return mapUser(await request<Record<string, unknown>>('/auth/me/'))
  },

  // --- problems ---

  async getProblems(filters?: {
    difficulty?: string
    tags?: string[]
    search?: string
    page?: number
    limit?: number
  }): Promise<{ problems: Problem[]; total: number }> {
    const params = new URLSearchParams()
    if (filters?.difficulty && filters.difficulty !== 'all') {
      params.append('difficulty', filters.difficulty)
    }
    if (filters?.search) params.append('search', filters.search)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('page_size', String(filters.limit))
    filters?.tags?.forEach((t) => params.append('tags', t))

    const qs = params.toString()
    const data = await request<{ count: number; results: DjangoProblem[] }>(
      `/problems/${qs ? `?${qs}` : ''}`,
    )
    return { problems: data.results.map(toProblem), total: data.count }
  },

  async getProblem(slug: string): Promise<Problem> {
    return toProblem(await request<DjangoProblem>(`/problems/${slug}/`))
  },

  async getProblemEditorial(slug: string): Promise<{ editorial: string }> {
    // 403 here is the gate doing its job (§3.6) — surface it, do not swallow it.
    const data = await request<{ content: string }>(`/problems/${slug}/editorial/`)
    return { editorial: data.content }
  },

  // --- submissions ---

  async submitSolution(
    problemSlug: string,
    code: string,
    language: ProgrammingLanguage,
  ): Promise<{ submission: Submission; result: ExecutionResult }> {
    const raw = await request<DjangoSubmission>('/submissions/create/', {
      method: 'POST',
      body: JSON.stringify({
        problem_slug: problemSlug,
        source_code: code,
        language,
        kind: 'submit',
        // Server-side idempotency needs a stable key per attempt (§7.1); a
        // double-click then returns the first submission instead of a second.
        idempotency_key: `${problemSlug}-${language}-${hash(code)}`,
      }),
    })
    return { submission: toSubmission(raw), result: toExecutionResult(raw) }
  },

  async runTests(
    problemSlug: string,
    code: string,
    language: ProgrammingLanguage,
  ): Promise<ExecutionResult> {
    const raw = await request<DjangoSubmission>('/submissions/create/', {
      method: 'POST',
      body: JSON.stringify({
        problem_slug: problemSlug,
        source_code: code,
        language,
        kind: 'run', // sample groups only
        idempotency_key: `run-${problemSlug}-${language}-${hash(code)}-${Date.now()}`,
      }),
    })
    return toExecutionResult(raw)
  },

  async getSubmissions(problemSlug?: string): Promise<Submission[]> {
    const qs = problemSlug ? `?problem=${encodeURIComponent(problemSlug)}` : ''
    const data = await request<{ results: DjangoSubmission[] }>(`/submissions/${qs}`)
    return data.results.map(toSubmission)
  },

  async getSubmission(id: string): Promise<Submission> {
    return toSubmission(await request<DjangoSubmission>(`/submissions/${id}/`))
  },

  async getSubmissionStatus(
    id: string,
  ): Promise<{ verdict: VerdictStatus; score: string; isTerminal: boolean }> {
    const d = await request<{ verdict: VerdictStatus; score: string; is_terminal: boolean }>(
      `/submissions/${id}/status/`,
    )
    return { verdict: d.verdict, score: d.score, isTerminal: d.is_terminal }
  },

  // --- contests ---

  async getContests(): Promise<Contest[]> {
    const data = await request<{ server_time: string; results: Record<string, unknown>[] }>(
      '/contests/',
    )
    // server_time is deliberately surfaced so countdowns can be driven from an
    // offset rather than the browser clock (§7.2).
    serverTimeOffsetMs = new Date(data.server_time).getTime() - Date.now()

    return data.results.map((c) => ({
      id: String(c.id),
      name: String(c.title),
      description: String(c.description || ''),
      startTime: String(c.starts_at),
      endTime: String(c.ends_at),
      duration: Number(c.duration_minutes || 0),
      problemCount: Number(c.problem_count || 0),
      participantCount: Number(c.participant_count || 0),
      problems: [],
    }))
  },

  async getContest(slug: string): Promise<Contest> {
    const c = await request<Record<string, unknown>>(`/contests/${slug}/`)
    return {
      id: String(c.id),
      name: String(c.title),
      description: String(c.description || ''),
      startTime: String(c.starts_at),
      endTime: String(c.ends_at),
      duration: Number(c.duration_minutes || 0),
      problemCount: Number(c.problem_count || 0),
      participantCount: Number(c.participant_count || 0),
      problems: [],
    }
  },

  // --- progress and standings ---

  async getProgress(): Promise<Record<string, unknown>> {
    return request('/progress/me/')
  },

  async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
    const qs = limit ? `?limit=${limit}` : ''
    const rows = await request<Record<string, unknown>[]>(`/progress/leaderboard/${qs}`)
    return rows.map((r) => ({
      rank: Number(r.rank),
      userId: String(r.user_id),
      username: String(r.display_name || r.username),
      score: Number(r.score),
      problemsSolved: Number(r.problems_solved),
      lastSubmissionTime: '',
    }))
  },

  async getUser(id: string): Promise<User> {
    return mapUser(await request<Record<string, unknown>>(`/auth/me/`))
  },

  async updateUser(_id: string, _data: Partial<User>): Promise<User> {
    throw new ApiError(501, 'Profile editing is not implemented on the backend yet.')
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Offset between server and browser clocks. Drive countdowns from this. */
export let serverTimeOffsetMs = 0

export function serverNow(): Date {
  return new Date(Date.now() + serverTimeOffsetMs)
}

function mapUser(u: Record<string, unknown>): User {
  return {
    id: String(u.id),
    username: String(u.username),
    email: String(u.email),
    displayName: String(u.display_name || u.username),
    problemsSolved: Number(u.problems_solved || 0),
    totalSubmissions: Number(u.total_submissions || 0),
    currentStreak: Number(u.current_streak || 0),
    maxStreak: Number(u.max_streak || 0),
    rating: Number(u.rating || 0),
    joinedAt: String(u.created_at || ''),
  }
}

/** Small non-cryptographic hash, used only to key idempotent resubmissions. */
function hash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}
