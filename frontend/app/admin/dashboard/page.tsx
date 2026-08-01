'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, Code2, FileText, Send, Trophy, Users } from 'lucide-react'
import { AdminPageHeader, AdminShell } from '@/components/admin/layout/admin-shell'
import { AdminClient } from '@/lib/api/admin/client'
import type { AdminDashboard } from '@/lib/api/admin/types'

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    AdminClient.dashboard
      .get()
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <AdminPageHeader title="Overview" description="Platform activity at a glance." />

        {/* The unsandboxed judge is the largest gap between this build and
            something that can face untrusted users. It belongs on the first
            screen an operator sees, not buried in a document. */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-muted p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-sm">
            <p className="font-semibold text-warning">Judging is not sandboxed</p>
            <p className="mt-1 opacity-90">
              Submitted code runs in a subprocess on this host with no isolation from the
              filesystem, network, or database. Safe for a controlled demo; not safe for
              untrusted users. See design doc §3.1 and §8.1.
            </p>
          </div>
        </div>

        {error && (
          <div className="panel mb-6 border-danger/40 p-4 text-sm text-danger">{error}</div>
        )}

        {!data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Users"
                value={data.users.total}
                sub={`${data.users.active} active · ${data.users.new_this_week} new this week`}
                href="/admin/users"
              />
              <StatCard
                icon={Code2}
                label="Problems"
                value={data.problems.total}
                sub={`${data.problems.published} published · ${data.problems.drafts} draft`}
                href="/admin/problems"
              />
              <StatCard
                icon={Send}
                label="Submissions"
                value={data.submissions.total}
                sub={`${data.submissions.today} today · ${data.submissions.pending} pending`}
              />
              <StatCard
                icon={Trophy}
                label="Contests"
                value={data.contests.total}
                sub={`${data.contests.running} running · ${data.contests.upcoming} upcoming`}
                href="/admin/contests"
              />
            </div>

            {/* An empty platform is the expected first state, so it gets a real
                next step rather than four zeroes and nothing to do. */}
            {data.problems.total === 0 && (
              <div className="panel mt-6 p-6">
                <h2 className="font-display text-base font-semibold">
                  Nothing here yet — add your first problem
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                  A problem becomes solvable once it has a published version with at least one
                  sample test group. Sample groups run on “Run”; hidden groups run only on
                  “Submit” and never reach the browser.
                </p>
                <Link href="/admin/problems" className="btn btn-primary mt-5">
                  Go to problems
                </Link>
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="panel p-5">
                <h2 className="font-display text-sm font-semibold">Verdict distribution</h2>
                {data.verdict_breakdown.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No submissions yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {data.verdict_breakdown.map((v) => {
                      const max = Math.max(...data.verdict_breakdown.map((x) => x.count))
                      return (
                        <li key={v.verdict} className="flex items-center gap-3">
                          <span className="w-40 shrink-0 truncate text-[13px] text-muted-foreground">
                            {v.verdict.replace(/_/g, ' ')}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
                            <div
                              className={`h-full rounded-full ${
                                v.verdict === 'accepted' ? 'bg-success' : 'bg-primary-500'
                              }`}
                              style={{ width: `${max ? (v.count / max) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="tnum w-10 shrink-0 text-right text-[13px]">
                            {v.count}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="panel p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold">Recent admin activity</h2>
                  <Link href="/admin/audit" className="text-[13px] text-primary-600 hover:underline">
                    Full audit log
                  </Link>
                </div>
                {data.recent_activity.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No privileged actions recorded.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.recent_activity.slice(0, 6).map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3 text-[13px]">
                        <FileText size={14} className="mt-0.5 shrink-0 text-neutral-400" />
                        <div className="min-w-0">
                          <p className="truncate">{entry.summary || entry.action}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {entry.actor_label} · {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  sub: string
  href?: string
}) {
  const body = (
    <div className="panel panel-interactive h-full p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={15} />
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <p className="tnum mt-2 font-display text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{sub}</p>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}
