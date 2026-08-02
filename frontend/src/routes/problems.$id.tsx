import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Lock,
  Play,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";

import { CodeEditor } from "@/components/code-editor";
import { GuardedPage } from "@/components/guarded";
import { DifficultyBadge, ErrorState, Spinner, VerdictBadge } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import {
  useCreateSubmission,
  useProblem,
  useSubmission,
  useSubmissionStatus,
  useSubmissions,
} from "@/lib/api/queries";
import type { Submission } from "@/lib/api/types";
import {
  formatMemory,
  formatRelative,
  formatRuntime,
  formatScore,
  verdictTone,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/problems/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Problem ${params.id} — Sodak-Tech Workspace` },
      {
        name: "description",
        content:
          "Read the statement, write a solution in the browser editor and submit it for instant judging.",
      },
      { property: "og:title", content: `Problem ${params.id} — Sodak-Tech Workspace` },
      {
        property: "og:description",
        content: "Solve the problem in a split editor workspace with run and submit.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/problems/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/problems/${params.id}` }],
  }),
  component: WorkspacePage,
});

/** Enough scaffolding to read input, so nobody starts from an empty buffer. */
const STARTERS: Record<string, string> = {
  python: `import sys

def main() -> None:
    data = sys.stdin.read().split()
    # TODO: solve
    print()

main()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // TODO: solve
    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {
    /* TODO: solve */
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        // TODO: solve
    }
}
`,
  javascript: `const data = require("fs").readFileSync(0, "utf8").split(/\\s+/);
// TODO: solve
`,
};

const draftKey = (slug: string, language: string) => `sodak:draft:${slug}:${language}`;

function WorkspacePage() {
  const { id: slug } = Route.useParams();
  const problem = useProblem(slug);
  const history = useSubmissions({ problem: slug, includeRuns: true });
  const createSubmission = useCreateSubmission();

  const [language, setLanguage] = useState<string>("");
  const [code, setCode] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const languages = useMemo(() => problem.data?.languages ?? [], [problem.data]);

  // Settle on a language once the problem loads: the one used last for this
  // problem if it is still offered, otherwise whatever the judge lists first.
  useEffect(() => {
    if (language || languages.length === 0) return;
    const remembered =
      typeof window === "undefined" ? null : localStorage.getItem(`sodak:lang:${slug}`);
    setLanguage(
      remembered && languages.some((l) => l.id === remembered) ? remembered : languages[0]!.id,
    );
  }, [languages, language, slug]);

  // Drafts are keyed by problem *and* language. Switching language mid-attempt
  // must not silently discard the C++ you had already written.
  useEffect(() => {
    if (!language || typeof window === "undefined") return;
    const saved = localStorage.getItem(draftKey(slug, language));
    setCode(saved ?? STARTERS[language] ?? "");
  }, [slug, language]);

  useEffect(() => {
    if (!language || !code || typeof window === "undefined") return;
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey(slug, language), code);
      localStorage.setItem(`sodak:lang:${slug}`, language);
    }, 400);
    return () => clearTimeout(timer);
  }, [code, slug, language]);

  // While a submission is judged, poll its status; once terminal, fetch the
  // full record with its per-group breakdown.
  const status = useSubmissionStatus(activeId);
  const settled = Boolean(status.data?.is_terminal);
  const detail = useSubmission(activeId ?? "", settled);
  const active: Submission | undefined = detail.data;

  useEffect(() => {
    if (settled) history.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  const submit = (kind: "run" | "submit") => {
    if (!problem.data || !language || createSubmission.isPending) return;
    createSubmission.mutate(
      { problem_slug: slug, language, source_code: code, kind },
      { onSuccess: (created) => setActiveId(created.id) },
    );
  };

  const submitError =
    createSubmission.error instanceof ApiError ? createSubmission.error : null;

  const pastSubmissions = useMemo(
    () => (history.data ?? []).filter((s) => s.kind === "submit"),
    [history.data],
  );

  if (problem.isLoading) {
    return (
      <GuardedPage wide>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-6 w-6 text-muted-foreground" />
        </div>
      </GuardedPage>
    );
  }

  if (problem.isError || !problem.data) {
    return (
      <GuardedPage wide>
        <ErrorState
          title="Problem not available"
          error={problem.error}
          onRetry={() => problem.refetch()}
        />
        <Link to="/problems" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to problems
        </Link>
      </GuardedPage>
    );
  }

  const p = problem.data;

  return (
    <GuardedPage wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Problems
          </Link>
          <span className="text-border">/</span>
          <h1 className="text-lg font-semibold tracking-tight">{p.title}</h1>
          <DifficultyBadge difficulty={p.difficulty} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatRuntime(p.time_limit_ms)} limit</span>
          <span>{p.memory_limit_mb} MB</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* -----------------------------------------------------------
            Statement
        ----------------------------------------------------------- */}
        <section className="rounded-lg border border-border bg-card">
          <Tabs defaultValue="description">
            <TabsList className="m-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="editorial">Editorial</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent
              value="description"
              className="max-h-[70vh] space-y-5 overflow-y-auto px-5 pb-6 text-sm leading-relaxed"
            >
              <p className="whitespace-pre-wrap">{p.statement || "No statement provided yet."}</p>

              {p.input_format && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Input</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{p.input_format}</p>
                </div>
              )}
              {p.output_format && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Output</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{p.output_format}</p>
                </div>
              )}
              {p.constraints && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Constraints</h3>
                  <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                    {p.constraints}
                  </p>
                </div>
              )}

              {/* Sample cases only. Hidden test data is never serialised to
                  the client (§8.1) — it is not filtered out here, it never
                  arrives in the first place. */}
              {p.examples.map((example, index) => (
                <div key={index}>
                  <h3 className="mb-1 text-sm font-semibold">Example {index + 1}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Input
                      </p>
                      <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-xs">
                        {example.input || "(empty)"}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Output
                      </p>
                      <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-xs">
                        {example.output}
                      </pre>
                    </div>
                  </div>
                  {example.explanation && (
                    <p className="mt-2 text-xs text-muted-foreground">{example.explanation}</p>
                  )}
                </div>
              ))}

              {p.notes && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Notes</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">{p.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="editorial" className="px-5 pb-6">
              {/* §3.6: the gate is server-side. This flag decides whether to
                  offer the tab; the content lives behind its own endpoint that
                  re-checks, so a client that lies about it gains nothing. */}
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Lock className="h-7 w-7 text-muted-foreground/60" />
                <p className="text-sm font-medium">
                  {p.editorial_unlocked ? "Editorial available" : "Editorial locked"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {p.editorial_unlocked
                    ? "You have met the unlock conditions for this problem."
                    : "Solve the problem, or make a few genuine attempts, and the editorial unlocks. Viewing it scales your score for this problem but never your mastery."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="submissions" className="px-5 pb-6">
              {pastSubmissions.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No submissions for this problem yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {pastSubmissions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <VerdictBadge verdict={s.verdict} />
                        <span className="text-xs text-muted-foreground">{s.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatScore(s.score)} pts</span>
                        <span>{formatRelative(s.received_at)}</span>
                        <Link
                          to="/submissions/$id"
                          params={{ id: s.id }}
                          className="text-primary hover:underline"
                        >
                          Detail
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* -----------------------------------------------------------
            Editor
        ----------------------------------------------------------- */}
        <section className="flex flex-col rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
              aria-label="Language"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.version}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCode(STARTERS[language] ?? "")}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset to the starter template"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => submit("run")}
                disabled={createSubmission.isPending}
                className="gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                Run
              </Button>
              <Button
                size="sm"
                onClick={() => submit("submit")}
                disabled={createSubmission.isPending}
                className="gap-1.5"
              >
                {createSubmission.isPending ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Submit
              </Button>
            </div>
          </div>

          <div className="flex-1 p-3">
            <CodeEditor
              value={code}
              language={language}
              onChange={setCode}
              onSubmit={() => submit("submit")}
              height="440px"
            />
          </div>

          <p className="px-3 pb-2 text-xs text-muted-foreground">
            Run executes the sample tests only. Submit runs the full hidden set.
            <span className="ml-1 opacity-70">Ctrl/Cmd + Enter to submit.</span>
          </p>

          {(submitError || activeId) && (
            <div className="border-t border-border p-3">
              {submitError ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive-muted/40 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Submission not accepted
                    </p>
                    <p className="text-sm text-muted-foreground">{submitError.message}</p>
                    {submitError.retryAfter ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try again in about {submitError.retryAfter}s.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : !settled ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  {status.data?.verdict === "running"
                    ? "Running against tests…"
                    : "Queued for judging…"}
                </div>
              ) : active ? (
                <SubmissionConsole submission={active} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Loading results…
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </GuardedPage>
  );
}

function SubmissionConsole({ submission }: { submission: Submission }) {
  const tone = verdictTone(submission.verdict);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={submission.verdict} />
        <span className="text-sm font-medium">{formatScore(submission.score)} points</span>
        <span className="text-xs text-muted-foreground">
          {formatRuntime(submission.max_runtime_ms)} · {formatMemory(submission.max_memory_kb)}
        </span>
        <Link
          to="/submissions/$id"
          params={{ id: submission.id }}
          className="ml-auto text-xs text-primary hover:underline"
        >
          Full breakdown
        </Link>
      </div>

      {submission.compile_output && (
        <pre className="max-h-40 overflow-auto rounded bg-muted p-3 font-mono text-xs text-muted-foreground">
          {submission.compile_output}
        </pre>
      )}

      <ul className="space-y-1.5">
        {submission.results.map((group, index) => (
          <li
            key={index}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              {group.passed ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>{group.test_group_name}</span>
              <span className="text-xs text-muted-foreground">weight {group.weight}</span>
            </span>
            <span
              className={cn("text-xs", group.passed ? "text-success" : "text-muted-foreground")}
            >
              {group.cases_passed}/{group.cases_total} cases
            </span>
          </li>
        ))}
      </ul>

      {tone === "warning" && (
        <p className="text-xs text-muted-foreground">
          Your solution ran but exceeded a resource limit. The logic may well be right — the
          approach is too slow or uses too much memory.
        </p>
      )}
      {submission.verdict === "internal_error" && (
        <p className="text-xs text-muted-foreground">
          This one is on us, not you. The judge could not run your submission, and it does not
          count as an attempt.
        </p>
      )}
    </div>
  );
}
