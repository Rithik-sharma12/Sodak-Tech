'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Code2, Plus, Search } from 'lucide-react'
import { AdminPageHeader, AdminShell, EmptyState } from '@/components/admin/layout/admin-shell'
import { AdminClient } from '@/lib/api/admin/client'
import type { AdminProblemSummary } from '@/lib/api/admin/types'

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-success-muted text-success',
  medium: 'bg-warning-muted text-warning',
  hard: 'bg-danger-muted text-danger',
}

export default function AdminProblemsPage() {
  const [problems, setProblems] = useState<AdminProblemSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const page = await AdminClient.problems.list(q ? { search: q } : undefined)
      setProblems(page.results)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <AdminPageHeader
          title="Problems"
          description="Authoring and versioning. Published versions are immutable — a change is always a new version."
          actions={
            <Link href="/admin/problems/new" className="btn btn-primary">
              <Plus size={16} />
              New problem
            </Link>
          }
        />

        <div className="relative mb-4 max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems…"
            aria-label="Search problems"
            className="input h-9 pl-9"
          />
        </div>

        {error && (
          <div className="panel mb-4 border-danger/40 p-3 text-sm text-danger">{error}</div>
        )}

        {loading ? (
          <div className="panel h-64 animate-pulse" />
        ) : problems.length === 0 ? (
          <EmptyState
            icon={Code2}
            title={search ? 'No matching problems' : 'No problems yet'}
            description={
              search
                ? 'Try a different search term.'
                : 'Create a problem, then publish a version with test groups to make it solvable.'
            }
            action={
              !search && (
                <Link href="/admin/problems/new" className="btn btn-primary">
                  <Plus size={16} />
                  Create the first problem
                </Link>
              )
            }
          />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Problem</th>
                    <th className="px-4 py-3 font-medium">Difficulty</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 text-right font-medium">Versions</th>
                    <th className="px-4 py-3 text-right font-medium">Solved</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/problems/${p.slug}`}
                          className="font-medium hover:text-primary-600 hover:underline"
                        >
                          {p.title}
                        </Link>
                        <div className="font-mono text-[12px] text-muted-foreground">{p.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${
                            DIFFICULTY_STYLES[p.difficulty]
                          }`}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {/* "Submittable" is the state that matters: public
                            alone is not enough without a published version. */}
                        <span className="text-[13px]">
                          {p.is_submittable ? (
                            <span className="text-success">Live</span>
                          ) : p.is_public ? (
                            <span className="text-warning">Public, no version</span>
                          ) : (
                            <span className="text-muted-foreground">Draft</span>
                          )}
                        </span>
                      </td>
                      <td className="tnum px-4 py-3 text-right">{p.version_count}</td>
                      <td className="tnum px-4 py-3 text-right">{p.solved_count}</td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {p.author_username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
