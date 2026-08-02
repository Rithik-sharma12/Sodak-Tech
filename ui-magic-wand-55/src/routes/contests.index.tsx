import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Clock, ListOrdered } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { pastContests, upcomingContests } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contests/")({
  head: () => ({
    meta: [
      { title: "Contests — Sodak-Tech" },
      {
        name: "description",
        content:
          "Join live and upcoming rated contests, register for future rounds and review past standings.",
      },
      { property: "og:title", content: "Contests — Sodak-Tech" },
      {
        property: "og:description",
        content: "Live rounds, upcoming schedule and your rating history.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contests" },
    ],
    links: [{ rel: "canonical", href: "/contests" }],
  }),
  component: ContestsPage,
});

function ContestsPage() {
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contests</h1>
        <div className="flex gap-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Rating</p>
            <p className="text-xl font-semibold">1450</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Global rank</p>
            <p className="text-xl font-semibold">#4,821</p>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-primary/30 bg-card p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive-muted px-2.5 py-1 text-xs font-semibold text-destructive">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          LIVE
        </span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Weekly Challenge 142{" "}
              <span className="ml-1 rounded-full bg-primary-muted px-2 py-0.5 align-middle text-xs font-medium text-primary">
                Rated
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              4 problems · 90 minutes · 1,204 participants · Ends 14:30 UTC
            </p>
          </div>
          <div className="flex items-end gap-8">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Time remaining</p>
              <p className="font-mono text-xl font-semibold">01:14:23</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your rank</p>
              <p className="text-xl font-semibold">#87</p>
            </div>
            <Button asChild className="gap-1.5">
              <Link to="/contests/$id" params={{ id: "weekly-142" }}>
                Enter contest
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">
          Upcoming <span className="ml-1 text-muted-foreground">{upcomingContests.length}</span>
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {upcomingContests.map((c) => (
            <div key={c.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">{c.name}</h3>
              <span
                className={cn(
                  "mt-1.5 w-fit rounded-full px-2 py-0.5 text-xs font-medium",
                  c.rated ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {c.rated ? "Rated" : "Unrated"}
              </span>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {c.when}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {c.duration}
                </li>
                <li className="flex items-center gap-2">
                  <ListOrdered className="h-3.5 w-3.5" />
                  {c.problems}
                </li>
              </ul>
              <div className="mt-4 pt-1">
                {c.registered ? (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Registered
                    </p>
                    <button className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                      Cancel registration
                    </button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Register
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Past contests</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Contest</th>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Your rank</th>
              <th className="px-4 py-2.5 font-medium">Rating change</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {pastContests.map((c) => (
              <tr key={c.name} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  {c.name}
                  {!c.rated && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      Unrated
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.rank}</td>
                <td
                  className={cn(
                    "px-4 py-3 font-mono text-xs",
                    c.delta === null && "text-muted-foreground",
                    c.delta !== null && c.delta > 0 && "text-success",
                    c.delta !== null && c.delta < 0 && "text-destructive",
                  )}
                >
                  {c.delta === null ? "—" : c.delta > 0 ? `↑ +${c.delta}` : `↓ ${c.delta}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/contests/$id"
                    params={{ id: "weekly-142" }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Standings
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-border px-4 py-3">
          <button className="text-xs font-medium text-primary hover:underline">
            View all past contests
          </button>
        </div>
      </section>
    </AppShell>
  );
}
