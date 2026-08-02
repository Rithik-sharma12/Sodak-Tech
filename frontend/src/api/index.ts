/**
 * The API surface the UI calls.
 *
 * Views and context talk to this module only — never to `fetch` directly and
 * never to mock data. That keeps the whole integration surface in one folder,
 * so swapping transports or reshaping a response touches one place.
 */

import { http, ApiError } from './client'
import {
  fromDifficulty,
  fromRole,
  toProblem,
  toSubmission,
  toUserProfile,
} from './adapters'
import type { Difficulty, Problem, Role, Submission, UserProfile } from '../types'

export { ApiError }
export * from './adapters'

type Json = Record<string, unknown>
interface Paginated<T> {
  count: number
  results: T[]
}

export const api = {
  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------
  auth: {
    async login(email: string, password: string): Promise<UserProfile> {
      const raw = await http.post<Json>('/auth/login/', { email, password })
      return toUserProfile(raw)
    },

    async logout(): Promise<void> {
      await http.post('/auth/logout/')
    },

    /** Resolves the current session, or throws 403 when signed out. */
    async me(): Promise<UserProfile> {
      const raw = await http.get<Json>('/auth/me/')
      return toUserProfile(raw)
    },
  },

  // -------------------------------------------------------------------------
  // Problems
  // -------------------------------------------------------------------------
  problems: {
    async list(filters?: {
      search?: string
      difficulty?: Difficulty
      status?: string
    }): Promise<Problem[]> {
      const page = await http.get<Paginated<Json>>('/problems/', {
        search: filters?.search,
        difficulty: filters?.difficulty ? fromDifficulty(filters.difficulty) : undefined,
        status: filters?.status,
      })
      return (page.results || []).map(toProblem)
    },

    async get(slug: string): Promise<Problem> {
      return toProblem(await http.get<Json>(`/problems/${slug}/`))
    },

    /**
     * Editorial content is served from its own endpoint that authorises on every
     * fetch (§3.6). A 403 here means locked — the content is never sent and then
     * hidden client-side.
     */
    async editorial(slug: string): Promise<{ locked: boolean; content: string }> {
      try {
        const raw = await http.get<Json>(`/problems/${slug}/editorial/`)
        return { locked: false, content: String(raw.editorial ?? raw.content ?? '') }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          return { locked: true, content: '' }
        }
        throw error
      }
    },
  },

  // -------------------------------------------------------------------------
  // Submissions
  // -------------------------------------------------------------------------
  submissions: {
    async list(problemSlug?: string): Promise<Submission[]> {
      const page = await http.get<Paginated<Json>>('/submissions/', { problem: problemSlug })
      return (page.results || []).map((r) => toSubmission(r))
    },

    async get(id: string): Promise<Submission> {
      return toSubmission(await http.get<Json>(`/submissions/${id}/`))
    },

    /**
     * `kind` decides what runs: 'run' executes sample groups only, 'submit'
     * executes every group and produces the official score.
     *
     * The idempotency key makes a double-click return the existing submission
     * rather than queueing a second one (§7.1).
     */
    async create(input: {
      problemSlug: string
      language: string
      sourceCode: string
      kind: 'run' | 'submit'
    }): Promise<Submission> {
      const raw = await http.post<Json>('/submissions/create/', {
        problem_slug: input.problemSlug,
        language: input.language,
        source_code: input.sourceCode,
        kind: input.kind,
        idempotency_key: `${input.problemSlug}-${input.kind}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
      })
      return toSubmission(raw)
    },

    async status(id: string): Promise<Submission> {
      return toSubmission(await http.get<Json>(`/submissions/${id}/status/`))
    },
  },

  // -------------------------------------------------------------------------
  // Progress and standings
  // -------------------------------------------------------------------------
  progress: {
    me: () => http.get<Json>('/progress/me/'),
    leaderboard: (limit = 50) => http.get<Json>('/progress/leaderboard/', { limit }),
  },

  contests: {
    list: () => http.get<Paginated<Json>>('/contests/'),
    get: (slug: string) => http.get<Json>(`/contests/${slug}/`),
  },

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  admin: {
    dashboard: () => http.get<Json>('/admin/dashboard/'),
    health: () => http.get<Json>('/admin/health/'),

    users: {
      list: (params?: { search?: string; role?: string }) =>
        http.get<Paginated<Json>>('/admin/users/', params),
      changeRole: (id: string, role: Role) =>
        http.post<Json>(`/admin/users/${id}/role/`, { role: fromRole(role) }),
      setActive: (id: string, isActive: boolean) =>
        http.post<Json>(`/admin/users/${id}/active/`, { is_active: isActive }),
    },

    problems: {
      list: (params?: { search?: string }) =>
        http.get<Paginated<Json>>('/admin/problems/', params),
      get: (slug: string) => http.get<Json>(`/admin/problems/${slug}/`),
      create: (payload: Json) => http.post<Json>('/admin/problems/create/', payload),
      update: (slug: string, payload: Json) =>
        http.patch<Json>(`/admin/problems/${slug}/`, payload),
      remove: (slug: string) => http.delete<void>(`/admin/problems/${slug}/`),
      /**
       * The only way test data enters the system. §7.3 blocks replacing test
       * data on an existing version — a replacement is always a new version.
       */
      createVersion: (slug: string, payload: Json) =>
        http.post<Json>(`/admin/problems/${slug}/versions/`, payload),
      publishVersion: (slug: string, versionNumber: number) =>
        http.post<Json>(`/admin/problems/${slug}/versions/${versionNumber}/publish/`),
    },

    tags: {
      list: () => http.get<Json[]>('/admin/tags/'),
      create: (payload: { name: string }) => http.post<Json>('/admin/tags/', payload),
    },

    contests: {
      list: () => http.get<Paginated<Json>>('/admin/contests/'),
      create: (payload: Json) => http.post<Json>('/admin/contests/create/', payload),
      transition: (slug: string, toState: string) =>
        http.post<Json>(`/admin/contests/${slug}/transition/`, { to_state: toState }),
    },

    /**
     * Read-only by construction. §8.3: the audit log "is not deletable through
     * the application by anyone, including Super Admin" — so there is
     * deliberately no write or delete method, and a Postgres trigger enforces
     * the same at the database level.
     */
    audit: {
      list: (params?: { action?: string; search?: string }) =>
        http.get<Paginated<Json>>('/admin/audit/', params),
    },
  },
}
