import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useAdminContests } from "@/lib/api/queries";
import { CONTEST_STATE_LABELS, contestStateTone, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/contests")({
  head: () => ({
    meta: [
      { title: "Contests — Admin · Sodak-Tech" },
      {
        name: "description",
        content: "Create and manage contests, schedules, transitions and problem sets.",
      },
    ],
  }),
  component: AdminContestsPage,
});

function AdminContestsPage() {
  const contests = useAdminContests();

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Contests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create rounds, manage schedules and drive state transitions.
          </p>
        </header>
        <Button asChild className="gap-1.5">
          <Link to="/admin/contests/new">
            <Plus className="h-4 w-4" />
            New contest
          </Link>
        </Button>
      </div>

      {contests.isError ? (
        <ErrorState error={contests.error} onRetry={() => contests.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Contest</th>
                <th className="px-4 py-2.5 font-medium">State</th>
                <th className="px-4 py-2.5 font-medium">Starts</th>
                <th className="px-4 py-2.5 font-medium">Ends</th>
                <th className="px-4 py-2.5 font-medium">Problems</th>
                <th className="px-4 py-2.5 font-medium">Registered</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {contests.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Spinner className="mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : (contests.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="p-6">
                      <EmptyState
                        title="No contests yet"
                        description="Create a draft round, attach problems and publish it when ready."
                        action={
                          <Button asChild size="sm">
                            <Link to="/admin/contests/new">New contest</Link>
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                (contests.data ?? []).map((c) => {
                  const tone = contestStateTone(c.state);
                  return (
                    <tr key={c.slug} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/contests/$slug"
                          params={{ slug: c.slug }}
                          className="font-medium hover:text-primary"
                        >
                          {c.title}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">{c.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            tone === "success" && "bg-success-muted text-success",
                            tone === "warning" && "bg-warning-muted text-warning-foreground",
                            tone === "muted" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {CONTEST_STATE_LABELS[c.state]}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDateTime(c.starts_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDateTime(c.ends_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.problem_count}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.registration_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.owner_username}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
