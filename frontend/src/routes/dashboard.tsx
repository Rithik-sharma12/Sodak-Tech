import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, Flame, Inbox, Play } from "lucide-react";

import { GuardedPage } from "@/components/guarded";
import {
  DifficultyBadge,
  EmptyState,
  ErrorState,
  Meter,
  Spinner,
  VerdictBadge,
} from "@/components/primitives";
import { useMe, useProblems, useProgress, useSubmissions } from "@/lib/api/queries";
import { formatPercent, formatRelative, formatRuntime } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Sodak-Tech" },
      {
        name: "description",
        content:
          "Track solved problems, acceptance rate, streaks, rating and recommended practice on Sodak-Tech.",
      },
      { property: "og:title", content: "Student Dashboard — Sodak-Tech" },
      {
        property: "og:description",
        content: "Your solving stats, weekly activity, topic mastery and recent verdicts.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/dashboard" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: DashboardPage,
});

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Submissions per day for the last seven days.
 *
 * The API returns a sparse activity series — only days with submissions — so
 * the missing days are filled in here. Without that, a quiet week renders as a
 * chart with two bars in it and no sense of the gap between them.
 */
function lastSevenDays(activity: { date: string; count: number }[]) {
  const counts = new Map(activity.map((a) => [a.date, a.count]));
  const days: { label: string; value: number }[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    days.push({ label: DAY_INITIALS[day.getDay()]!, value: counts.get(key) ?? 0 });
  }
  return days;
}

function DashboardPage() {
  const { data: user } = useMe();
  const progress = useProgress();
  const submissions = useSubmissions();
  // Unsolved problems, as practice suggestions. The backend has no
  // recommendation engine yet, so this is honestly "what you have not done"
  // rather than a personalised ranking dressed up as one.
  const problems = useProblems();

  if (progress.isError) {
    return (
      <GuardedPage>
        <ErrorState error={progress.error} onRetry={() => progress.refetch()} />
      </GuardedPage>
    );
  }

  const summary = progress.data;
  const week = lastSevenDays(summary?.activity ?? []);
  const maxDay = Math.max(1, ...week.map((d) => d.value));

  const recent = (submissions.data ?? []).slice(0, 5);
  const suggestions = (problems.data ?? [])
    .filter((p) => p.progress_state === "not_attempted" || p.progress_state === "attempted")
    .slice(0, 3);

  const stats = [
    {
      label: "Problems solved",
      value: summary ? String(summary.problems_solved) : "—",
      note: summary ? `${summary.problems_attempted} attempted` : undefined,
    },
    {
      label: "Acceptance rate",
      value: summary ? formatPercent(summary.acceptance_rate, 0) : "—",
      note: summary ? `${summary.total_submissions} submissions` : undefined,
    },
    {
      label: "Current streak",
      value: summary ? String(summary.current_streak) : "—",
      unit: "days",
    },
    {
      label: "Rating",
      value: user ? String(user.rating) : "—",
      note: user ? `Peak ${user.peak_rating}` : undefined,
    },
  ];

  return (
    <GuardedPage>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.display_name?.split(" ")[0] || user?.username || "there"}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-warning" />
          {summary && summary.current_streak > 0
            ? `You are on a ${summary.current_streak} day streak — keep it going.`
            : "Solve a problem today to start a streak."}
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight">
                {progress.isLoading ? <Spinner className="h-5 w-5" /> : s.value}
              </span>
              {s.unit && <span className="text-sm text-muted-foreground">{s.unit}</span>}
            </div>
            {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Weekly activity</h2>
          <div className="mt-6 flex h-40 items-end gap-3">
            {week.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-sm bg-primary/85 transition-[height] duration-500"
                  // A zero-submission day still gets a sliver so the column
                  // reads as "nothing here" rather than as a rendering fault.
                  style={{ height: `${Math.max(2, (d.value / maxDay) * 100)}%` }}
                  title={`${d.value} submission${d.value === 1 ? "" : "s"}`}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Topic mastery</h2>
          {summary && summary.by_tag.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {summary.by_tag.slice(0, 6).map((t) => {
                const pct = t.total > 0 ? (t.solved / t.total) * 100 : 0;
                return (
                  <li key={t.tag}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{t.tag}</span>
                      <span className="text-muted-foreground">
                        {t.solved}/{t.total}
                      </span>
                    </div>
                    <Meter value={pct} className="mt-1.5" />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Solve a tagged problem and your strengths by topic appear here.
            </p>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Recent submissions</h2>
            <Link to="/problems" className="text-xs font-medium text-primary hover:underline">
              Browse problems
            </Link>
          </div>

          {submissions.isLoading ? (
            <div className="p-8 text-center">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Inbox}
                title="No submissions yet"
                description="Pick a problem, write a solution and submit it — your verdicts land here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Problem</th>
                    <th className="px-4 py-2 font-medium">Verdict</th>
                    <th className="px-4 py-2 font-medium">Lang</th>
                    <th className="px-4 py-2 font-medium">Runtime</th>
                    <th className="px-4 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link
                          to="/submissions/$id"
                          params={{ id: s.id }}
                          className="hover:text-primary"
                        >
                          {s.problem_title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={s.verdict} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.language}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatRuntime(s.max_runtime_ms)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatRelative(s.received_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Try next</h2>
          <p className="text-xs text-muted-foreground">Problems you have not solved yet</p>

          {suggestions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {problems.isLoading
                ? "Loading…"
                : (problems.data?.length ?? 0) === 0
                  ? "No problems have been published yet."
                  : "You have solved everything published. Impressive."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {suggestions.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/problems/$id"
                    params={{ id: p.slug }}
                    className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs">
                        <DifficultyBadge difficulty={p.difficulty} />
                        <span className="text-muted-foreground">
                          {p.tags[0]?.name ?? "Untagged"} ·{" "}
                          {formatPercent(p.acceptance_rate, 0)} acc
                        </span>
                      </span>
                    </span>
                    <Play className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </GuardedPage>
  );
}
