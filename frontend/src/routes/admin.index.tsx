import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Inbox } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { useAdminDashboard } from "@/lib/api/queries";
import { formatCount, formatRelative, VERDICT_LABELS, verdictTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — Sodak-Tech" },
      {
        name: "description",
        content:
          "Platform activity at a glance: users, problems, submissions, contests, verdicts and the audit trail.",
      },
    ],
  }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const dashboard = useAdminDashboard();

  if (dashboard.isError) {
    return (
      <AdminShell>
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      </AdminShell>
    );
  }

  const stats = dashboard.data
    ? [
        {
          label: "Users",
          value: formatCount(dashboard.data.users.total),
          note: `${dashboard.data.users.active} active · ${dashboard.data.users.new_this_week} new this week`,
        },
        {
          label: "Problems",
          value: formatCount(dashboard.data.problems.total),
          note: `${dashboard.data.problems.published} published · ${dashboard.data.problems.drafts} draft`,
        },
        {
          label: "Submissions",
          value: formatCount(dashboard.data.submissions.total),
          note: `${dashboard.data.submissions.today} today · ${dashboard.data.submissions.pending} pending`,
        },
        {
          label: "Contests",
          value: formatCount(dashboard.data.contests.total),
          note: `${dashboard.data.contests.running} running · ${dashboard.data.contests.upcoming} upcoming`,
        },
      ]
    : [];

  const verdicts = dashboard.data?.verdict_breakdown ?? [];
  const maxVerdict = Math.max(1, ...verdicts.map((v) => v.count));
  const recent = dashboard.data?.recent_activity ?? [];

  return (
    <AdminShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform activity at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
              {dashboard.isLoading ? <Spinner className="h-5 w-5" /> : s.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Verdict distribution</h2>
          {verdicts.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Inbox}
                title="No verdicts yet"
                description="Once learners submit, accepted and failing verdicts are tallied here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {verdicts.map((v) => {
                const tone = verdictTone(v.verdict);
                return (
                  <li key={v.verdict} className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 truncate text-muted-foreground">
                      {VERDICT_LABELS[v.verdict] ?? v.verdict}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          tone === "success" && "bg-success",
                          tone === "warning" && "bg-warning",
                          tone === "danger" && "bg-destructive",
                          tone === "muted" && "bg-muted-foreground/40",
                        )}
                        style={{ width: `${Math.max(2, (v.count / maxVerdict) * 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono tabular-nums">
                      {formatCount(v.count)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Recent admin activity</h2>
            <Link
              to="/admin/audit"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Full audit log
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Inbox}
                title="Nothing audited yet"
                description="Privileged actions — publishes, role changes, test data reads — land here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-foreground">{entry.summary}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {entry.actor_label} · {formatRelative(entry.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
