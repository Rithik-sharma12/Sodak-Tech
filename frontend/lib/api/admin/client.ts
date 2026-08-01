/**
 * Admin API client.
 *
 * Talks to the real Django admin API at /api/v1/admin/, sharing the transport
 * in lib/api/client.ts so CSRF priming, credentials, and error shaping live in
 * one place. The server re-checks the caller's role on every request — §3.4 is
 * explicit that hiding a control in the UI is not access control.
 *
 * Endpoints that do not exist on the backend are not stubbed here. If a feature
 * is not built, its page says so rather than rendering invented data.
 */

import { http } from '@/lib/api/client'
import type {
  AdminAuditEntry,
  AdminContest,
  AdminDashboard,
  AdminProblemDetail,
  AdminProblemSummary,
  AdminSystemHealth,
  AdminTag,
  AdminUser,
  Paginated,
  VersionPayload,
} from './types'

const BASE = '/admin'

export const AdminClient = {
  dashboard: {
    get: () => http.get<AdminDashboard>(`${BASE}/dashboard/`),
  },

  health: {
    get: () => http.get<AdminSystemHealth>(`${BASE}/health/`),
  },

  users: {
    list: (params?: { search?: string; role?: string; is_active?: boolean; page?: number }) =>
      http.get<Paginated<AdminUser>>(`${BASE}/users/`, params),

    /**
     * Super Admin only, and never on your own account — the server enforces
     * both (§7.3: "Users cannot modify their own role under any
     * circumstances").
     */
    changeRole: (id: string, role: string) =>
      http.post<AdminUser>(`${BASE}/users/${id}/role/`, { role }),

    /**
     * Deactivation, not deletion. §9 requires soft delete for anything with
     * history attached, and a user with submissions has history.
     */
    setActive: (id: string, isActive: boolean) =>
      http.post<AdminUser>(`${BASE}/users/${id}/active/`, { is_active: isActive }),
  },

  problems: {
    list: (params?: { search?: string; page?: number }) =>
      http.get<Paginated<AdminProblemSummary>>(`${BASE}/problems/`, params),

    /** Includes hidden test data. The server audits this read (§8.3). */
    get: (slug: string) => http.get<AdminProblemDetail>(`${BASE}/problems/${slug}/`),

    create: (payload: Record<string, unknown>) =>
      http.post<AdminProblemDetail>(`${BASE}/problems/create/`, payload),

    update: (slug: string, payload: Record<string, unknown>) =>
      http.patch<AdminProblemDetail>(`${BASE}/problems/${slug}/`, payload),

    remove: (slug: string) => http.delete<void>(`${BASE}/problems/${slug}/`),

    /**
     * The only way test data enters the system. §7.3 blocks replacing test
     * data on an existing version — a replacement is always a new version.
     */
    createVersion: (slug: string, payload: VersionPayload) =>
      http.post<AdminProblemDetail>(`${BASE}/problems/${slug}/versions/`, payload),

    publishVersion: (slug: string, versionNumber: number) =>
      http.post<{ status: string; version: number }>(
        `${BASE}/problems/${slug}/versions/${versionNumber}/publish/`,
        {},
      ),
  },

  tags: {
    list: () => http.get<AdminTag[]>(`${BASE}/tags/`),
    create: (payload: { name: string; slug?: string; description?: string }) =>
      http.post<AdminTag>(`${BASE}/tags/`, payload),
    remove: (slug: string) => http.delete<void>(`${BASE}/tags/${slug}/`),
  },

  contests: {
    list: (params?: { page?: number }) =>
      http.get<Paginated<AdminContest>>(`${BASE}/contests/`, params),
    create: (payload: Record<string, unknown>) =>
      http.post<AdminContest>(`${BASE}/contests/create/`, payload),
    /**
     * Lifecycle moves are explicit operations, never field edits (§3.7). The
     * server validates against its adjacency map and rejects anything else.
     */
    transition: (slug: string, toState: string) =>
      http.post<AdminContest>(`${BASE}/contests/${slug}/transition/`, { to_state: toState }),
  },

  audit: {
    /**
     * Read-only by construction. §8.3: the log "is not deletable through the
     * application by anyone, including Super Admin" — so there is deliberately
     * no write or delete method here, and a Postgres trigger enforces the same
     * at the database level.
     */
    list: (params?: { action?: string; target_type?: string; search?: string; page?: number }) =>
      http.get<Paginated<AdminAuditEntry>>(`${BASE}/audit/`, params),
  },
}
