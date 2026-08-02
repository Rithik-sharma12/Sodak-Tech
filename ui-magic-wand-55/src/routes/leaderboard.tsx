import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, Flame, Minus, Search, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { currentUserRow, leaderboardRows, podium } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Sodak-Tech" },
      {
        name: "description",
        content:
          "Season 3 standings: top solvers, points, streaks and your current rank among 1,248 students.",
      },
      { property: "og:title", content: "Leaderboard — Sodak-Tech" },
      {
        property: "og:description",
        content: "See who leads the season by points, problems solved and streaks.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/leaderboard" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
  component: LeaderboardPage,
});

const tabs = ["Overall", "Weekly", "Monthly"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Move({ move }: { move: "up" | "down" | "flat" }) {
  if (move === "up") return <ArrowUp className="h-3.5 w-3.5 text-success" />;
  if (move === "down") return <ArrowDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function LeaderboardPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overall");

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Season 3 · ends in 14 days</p>
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your rank</p>
            <p className="text-xl font-semibold">#142</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your points</p>
            <p className="text-xl font-semibold">3,240</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-border bg-card p-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students" className="pl-9" />
        </div>
      </div>

      <div className="mt-6 grid items-end gap-4 sm:grid-cols-3">
        {podium.map((p) => (
          <div
            key={p.rank}
            className={cn(
              "rounded-lg border border-border bg-card p-5 text-center",
              p.rank === 1 && "border-warning/50 sm:-mt-6 sm:pb-8",
            )}
          >
            <span
              className={cn(
                "mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                p.rank === 1 && "bg-warning text-warning-foreground",
                p.rank !== 1 && "bg-muted text-muted-foreground",
              )}
            >
              {p.rank}
            </span>
            <Avatar className="mx-auto mt-3 h-14 w-14">
              <AvatarFallback className="bg-primary-muted text-sm text-primary">
                {initials(p.name)}
              </AvatarFallback>
            </Avatar>
            <p className="mt-3 text-sm font-semibold">{p.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{p.handle}</p>
            <div className="mt-4 flex justify-center gap-6 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Solved</p>
                <p className="font-mono text-sm">{p.solved.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Points</p>
                <p className="font-mono text-sm">{p.points.toLocaleString()}</p>
              </div>
            </div>
            {p.rank === 1 && (
              <Trophy className="mx-auto mt-4 h-4 w-4 text-warning" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-24 px-4 py-2.5 font-medium">Rank</th>
              <th className="px-4 py-2.5 font-medium">Student</th>
              <th className="px-4 py-2.5 font-medium">Solved</th>
              <th className="px-4 py-2.5 font-medium">Streak</th>
              <th className="px-4 py-2.5 font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardRows.map((r) => (
              <tr key={r.rank} className="border-b border-border">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                    <Move move={r.move} />
                    {r.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {initials(r.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.handle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.solved}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-warning">
                    <Flame className="h-3.5 w-3.5" />
                    {r.streak}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.points.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-primary-muted">
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <Move move={currentUserRow.move} />
                  {currentUserRow.rank}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                      PS
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {currentUserRow.name}
                      <span className="ml-2 text-[10px] font-semibold text-primary">YOU</span>
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {currentUserRow.handle}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{currentUserRow.solved}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 font-mono text-xs text-warning">
                  <Flame className="h-3.5 w-3.5" />
                  {currentUserRow.streak}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {currentUserRow.points.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing 1 to 15 of 1,248 entries</span>
        <div className="flex items-center gap-1">
          {["Prev", "1", "2", "3", "…", "84", "Next"].map((l, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "grid h-8 min-w-8 place-items-center rounded-md border border-border px-2 text-sm hover:bg-accent",
                l === "1" && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                l === "…" && "border-transparent hover:bg-transparent",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
