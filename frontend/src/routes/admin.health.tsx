import { createFileRoute } from "@tanstack/react-router";
import { Activity, Database, RefreshCcw, ServerCog } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { ErrorState, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useSystemHealth } from "@/lib/api/queries";
import { VERDICT_LABELS, verdictTone } from "@/lib/format";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/health")({
  head: () => ({
    meta: [
      { title: "System health — Admin · Sodak-Tech" },
      { name: "description", content: "Operational signals: database, cache, judging and queue." },
    ],
  }),
  component: AdminHealthPage,
});

function AdminHealthPage() {
  const health = useSystemHealth();

  if (health.isError) {
    return (
      <AdminShell>
        <ErrorState error={health.error} onRetry={() => health.refetch()} />
      </AdminShell>
    );
  }

  const checks = health.data?.checks ?? {};
  const verdicts = health.data?.verdict_distribution ?? [];
  const maxVerdict = Math.max(1, ...verdicts.map((v) => v.count));

  return (
    <AdminShell>
      <div className="flex items-end justify-between">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">System health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational signals. Refreshes every 15 seconds.
          </p>
        </header>
        <Button
          variant="outline"
          size="sm"
          onClick={() => health.refetch()}
          disabled={health.isFetching}
          className="gap-1.5"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", health.isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {health.isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Checks
              </h2>
              <ul className="mt-4 space-y-2">
                {Object.entries(checks).map(([name, status]) => {
                  const ok = status === "ok";
                  return (
                    <li key={name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        {name === "database" ? (
                          <Database className="h-4 w-4" />
                        ) : (
                          <ServerCog className="h-4 w-4" />
                        )}
                        {name}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          ok ? "text-success" : "text-destructive",
                        )}
                      >
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Judging</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd className="font-mono text-xs">{health.data?.judging_mode}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Queue depth</dt>
                  <dd className="font-mono text-xs">{health.data?.queue_depth}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Checked</dt>
                  <dd className="font-mono text-xs">{formatRelative(health.data?.checked_at)}</dd>
                </div>
              </dl>
              {health.data?.judging_warning ? (
                <p className="mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning-foreground">
                  {health.data.judging_warning}
                </p>
              ) : null}
            </section>
          </div>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Verdict distribution</h2>
            {verdicts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No submissions yet.</p>
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
                      <span className="w-10 text-right font-mono tabular-nums">{v.count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
