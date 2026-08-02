import { createFileRoute } from "@tanstack/react-router";
import { Calendar, LinkIcon, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Meter } from "@/components/primitives";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { activityHeatmap, profile } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Priya Sharma — Sodak-Tech Profile" },
      {
        name: "description",
        content:
          "Rating, solved problems by difficulty, a year of submission activity and topic strength.",
      },
      { property: "og:title", content: "Priya Sharma — Sodak-Tech Profile" },
      {
        property: "og:description",
        content: "A student profile with rating, solve breakdown and activity heatmap.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: "/profile" },
    ],
    links: [{ rel: "canonical", href: "/profile" }],
  }),
  component: ProfilePage,
});

const levelClass = [
  "bg-muted",
  "bg-success/25",
  "bg-success/45",
  "bg-success/70",
  "bg-success",
];

function ProfilePage() {
  const totalSolved = profile.solved.reduce((a, b) => a + b.value, 0);

  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary-muted text-lg text-primary">PS</AvatarFallback>
            </Avatar>
            <h1 className="mt-4 text-xl font-semibold tracking-tight">{profile.name}</h1>
            <p className="font-mono text-sm text-muted-foreground">{profile.handle}</p>
            <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {profile.joined}
              </li>
              <li className="flex items-center gap-2">
                <LinkIcon className="h-3.5 w-3.5" />
                <span className="text-primary">{profile.link}</span>
              </li>
            </ul>
            <Button variant="outline" size="sm" className="mt-5 w-full">
              Edit profile
            </Button>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Statistics</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {profile.stats.map((s) => (
                <li key={s.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-mono font-medium">{s.value}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Solved problems</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <ul className="space-y-3">
                {profile.solved.map((s) => (
                  <li key={s.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.label}</span>
                      <span className="font-mono text-muted-foreground">
                        {s.value} / {s.total}
                      </span>
                    </div>
                    <Meter value={(s.value / s.total) * 100} tone={s.tone} className="mt-1.5" />
                  </li>
                ))}
              </ul>
              <div className="text-center sm:pl-8">
                <p className="text-4xl font-semibold tracking-tight">{totalSolved}</p>
                <p className="text-xs text-muted-foreground">of 312 solved</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Activity</h2>
              <p className="text-xs text-muted-foreground">
                312 submissions in the last year
              </p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
                {activityHeatmap.map((level, i) => (
                  <span
                    key={i}
                    className={cn("h-2.5 w-2.5 rounded-[2px]", levelClass[level])}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
              Less
              {levelClass.map((c, i) => (
                <span key={i} className={cn("h-2.5 w-2.5 rounded-[2px]", c)} />
              ))}
              More
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Topic strength</h2>
            <ul className="mt-4 space-y-3">
              {profile.topicStrength.map((t) => (
                <li key={t.topic}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{t.topic}</span>
                    <span className="font-mono text-muted-foreground">
                      {t.solved} / {t.total}
                    </span>
                  </div>
                  <Meter value={(t.solved / t.total) * 100} className="mt-1.5" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
