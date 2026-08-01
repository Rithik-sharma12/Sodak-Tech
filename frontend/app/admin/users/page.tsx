'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, ShieldCheck, UserX, Users as UsersIcon } from 'lucide-react'
import { AdminPageHeader, AdminShell, EmptyState } from '@/components/admin/layout/admin-shell'
import { AdminClient } from '@/lib/api/admin/client'
import { ROLE_LABELS, type AdminUser, type Role } from '@/lib/api/admin/types'
import { API, type User } from '@/lib/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [me, setMe] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const page = await AdminClient.users.list(q ? { search: q } : undefined)
      setUsers(page.results)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    API.getCurrentUser().then(setMe).catch(() => setMe(null))
  }, [])

  // Debounced search — one request per pause, not per keystroke.
  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search, load])

  const isSuperAdmin = String(me?.role) === 'super_admin'

  const changeRole = async (user: AdminUser, role: Role) => {
    setBusyId(user.id)
    try {
      const updated = await AdminClient.users.changeRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (user: AdminUser) => {
    setBusyId(user.id)
    try {
      const updated = await AdminClient.users.setActive(user.id, !user.is_active)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <AdminPageHeader
          title="Users"
          description="Accounts, roles, and access. Deactivation preserves history — accounts are never deleted."
        />

        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email…"
            aria-label="Search users"
            className="input h-9 pl-9"
          />
        </div>

        {error && (
          <div className="panel mb-4 border-danger/40 p-3 text-sm text-danger">{error}</div>
        )}

        {loading ? (
          <div className="panel h-64 animate-pulse" />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={search ? 'No matching users' : 'No users yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Users appear here once people register on the platform.'
            }
          />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 text-right font-medium">Solved</th>
                    <th className="px-4 py-3 text-right font-medium">Submissions</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === String(me?.id)
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {u.display_name || u.username}
                            {isSelf && (
                              <span className="ml-2 text-[11px] text-muted-foreground">(you)</span>
                            )}
                          </div>
                          <div className="font-mono text-[12px] text-muted-foreground">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {/* Role assignment is Super Admin only, and never on
                              your own account — §3.4 and §7.3. The server
                              enforces both; this only reflects it. */}
                          {isSuperAdmin && !isSelf ? (
                            <select
                              value={u.role}
                              disabled={busyId === u.id}
                              onChange={(e) => changeRole(u, e.target.value as Role)}
                              aria-label={`Role for ${u.username}`}
                              className="input h-8 w-44 py-0 text-[13px]"
                            >
                              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS[r]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[13px]">
                              {u.role !== 'user' && (
                                <ShieldCheck size={13} className="text-primary-600" />
                              )}
                              {ROLE_LABELS[u.role]}
                            </span>
                          )}
                        </td>
                        <td className="tnum px-4 py-3 text-right">{u.solved_count}</td>
                        <td className="tnum px-4 py-3 text-right">{u.submission_count}</td>
                        <td className="px-4 py-3">
                          {/* Status is not conveyed by colour alone — the label
                              carries it too (WCAG). */}
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5
                              text-[12px] font-medium ${
                                u.is_active
                                  ? 'bg-success-muted text-success'
                                  : 'bg-danger-muted text-danger'
                              }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                u.is_active ? 'bg-success' : 'bg-danger'
                              }`}
                              aria-hidden
                            />
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggleActive(u)}
                            disabled={isSelf || busyId === u.id}
                            title={
                              isSelf
                                ? 'You cannot deactivate your own account'
                                : u.is_active
                                  ? 'Deactivate this account'
                                  : 'Reactivate this account'
                            }
                            className="btn btn-secondary h-8 text-[13px] disabled:cursor-not-allowed
                              disabled:opacity-40"
                          >
                            <UserX size={14} />
                            {u.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isSuperAdmin && users.length > 0 && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            Only a Super Admin can change roles.
          </p>
        )}
      </div>
    </AdminShell>
  )
}
