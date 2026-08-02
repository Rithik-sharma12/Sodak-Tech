import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CircleDashed, Minus, MoreVertical, Snowflake } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DifficultyBadge, Meter } from "@/components/primitives";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { contestProblems, contestStandings } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Contest ${params.id} — Sodak-Tech` },
      {
        name: "description",
        content:
          "Contest task list, your score progress and the frozen live standings for this round.",
      },
      { property: "og:title", content: `Contest ${params.id} — Sodak-Tech` },
      {
        property: "og:description",
        content: "Tasks, points, attempts and live standings for the round.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/contests/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/contests/${params.id}` }],
  }),
  component: ContestDetailPage,
});

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function ContestDetailPage() {
  const { id } = Route.useParams();

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Challenge 142</h1>
        <p className="font-mono text-xs text-muted-foreground">{id}</p>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-primary-muted p-3 text-sm">
        <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-foreground">
          Standings are frozen. Your own results still update; public ranks do not.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="overflow-hidden rounded-lg border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Problems</h2>
            <span className="text-xs text-muted-foreground">4 Tasks</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-12 px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Problem</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Points</th>
                <th className="px-4 py-2.5 font-medium">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {contestProblems.map((p) => (
                <tr key={p.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-sm font-semibold">{p.label}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/problems/$id"
                      params={{ id: "1" }}
                      className="font-medium hover:text-primary"
                    >
                      {p.title}
                    </Link>{" "}
                    <DifficultyBadge difficulty={p.difficulty} className="ml-1" />
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "solved" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                      </span>
                    )}
                    {p.status === "attempted" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                        <CircleDashed className="h-3.5 w-3.5" /> Attempted
                      </span>
                    )}
                    {p.status === "none" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Minus className="h-3.5 w-3.5" /> Not attempted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.points}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Your progress</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">100</span>
              <span className="text-sm text-muted-foreground">/ 600</span>
            </div>
            <Meter value={100 / 6} className="mt-3" />
            <p className="mt-3 text-xs text-muted-foreground">Solved 1 of 4</p>
            <p className="text-xs text-muted-foreground">
              Last solve <span className="font-mono">00:23:14</span>
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Standings</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[11px] font-medium text-primary">
                <Snowflake className="h-3 w-3" /> Frozen
              </span>
            </div>
            <ul>
              {contestStandings.map((s, i) => (
                <li key={s.name}>
                  {i === 3 && (
                    <div className="grid place-items-center py-1 text-muted-foreground">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 border-t border-border px-4 py-2.5 first:border-0">
                    <span className="w-6 font-mono text-xs text-muted-foreground">{s.rank}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {initials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm">{s.name}</span>
                    <span className="font-mono text-xs">{s.score}</span>
                  </div>
                </li>
              ))}
              <li className="flex items-center gap-3 border-t border-border bg-primary-muted px-4 py-2.5">
                <span className="w-6 font-mono text-xs text-primary">87</span>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                    PS
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium">
                  User123{" "}
                  <span className={cn("ml-1 text-[10px] font-semibold text-primary")}>YOU</span>
                </span>
                <span className="font-mono text-xs">100</span>
              </li>
            </ul>
            <div className="border-t border-border p-3">
              <Button variant="outline" size="sm" className="w-full">
                View full standings
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
