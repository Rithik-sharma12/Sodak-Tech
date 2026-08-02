import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Meter } from "@/components/primitives";
import { submittedCode, testGroups } from "@/data/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/submissions/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Submission ${params.id} — Sodak-Tech` },
      {
        name: "description",
        content:
          "Verdict, score breakdown by test group, runtime, memory and the submitted source code.",
      },
      { property: "og:title", content: `Submission ${params.id} — Sodak-Tech` },
      {
        property: "og:description",
        content: "See which test groups passed and how the score was computed.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/submissions/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/submissions/${params.id}` }],
  }),
  component: SubmissionPage,
});

function SubmissionPage() {
  const { id } = Route.useParams();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Submission</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {id} · submitted 12 minutes ago · Python 3.13
          </p>
        </header>

        <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive-muted p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <XCircle className="h-4 w-4" />
            Wrong Answer
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Stat label="Verdict" value="Wrong Answer" tone="destructive" />
          <Stat label="Score" value="40.00 / 100" />
          <Stat label="Runtime" value="42ms" mono />
          <Stat label="Memory" value="14.2MB" mono />
        </div>

        <section className="mt-4 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Test groups</h2>
            <p className="text-xs text-muted-foreground">
              Score is the sum of fully-passed group weights.
            </p>
          </div>
          <ul>
            {testGroups.map((g) => (
              <li key={g.name} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
                {g.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.passed} of {g.total} cases passed
                    {g.note ? ` · ${g.note}` : ""}
                  </p>
                  <Meter
                    value={(g.passed / g.total) * 100}
                    tone={g.ok ? "easy" : "hard"}
                    className="mt-2 max-w-xs"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Weight {g.weight}</p>
                  <p className="font-mono text-sm">{g.score}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Earned 4 of 10 weight</span>
            <span className="font-mono font-semibold">40.00 / 100</span>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold">Submitted code</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Python 3.13</span>
              <button
                type="button"
                aria-label="Copy code"
                onClick={() => navigator.clipboard?.writeText(submittedCode)}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex">
            <div className="select-none border-r border-border bg-muted/40 px-3 py-3 text-right font-mono text-xs leading-6 text-muted-foreground">
              {submittedCode.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="flex-1 overflow-x-auto p-3 font-mono text-xs leading-6">
              {submittedCode}
            </pre>
          </div>
        </section>

        <div className="mt-4">
          <Link
            to="/problems/$id"
            params={{ id: "1" }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to problem workspace
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "destructive";
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold",
          mono && "font-mono",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}
