import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileQuestion, RotateCcw, Search, X } from "lucide-react";

import { GuardedPage } from "@/components/guarded";
import {
  DifficultyBadge,
  EmptyState,
  ErrorState,
  Spinner,
  StatusIcon,
} from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { useProblems, useProgress, useTags } from "@/lib/api/queries";
import type { Difficulty, ProgressState } from "@/lib/api/types";
import { formatCount, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/problems/")({
  head: () => ({
    meta: [
      { title: "Problem Set — Sodak-Tech" },
      {
        name: "description",
        content:
          "Browse the Sodak-Tech problem set by difficulty, topic and solving status, and open any problem in the browser editor.",
      },
      { property: "og:title", content: "Problem Set — Sodak-Tech" },
      {
        property: "og:description",
        content: "Filter the problem set by difficulty, topic and your solving status.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/problems" },
    ],
    links: [{ rel: "canonical", href: "/problems" }],
  }),
  component: ProblemsPage,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const STATUS_FILTERS: { value: ProgressState | ""; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "not_attempted", label: "To do" },
  { value: "attempted", label: "Attempted" },
  { value: "solved", label: "Solved" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary-muted font-medium text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ProblemsPage() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [status, setStatus] = useState<ProgressState | "">("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const problems = useProblems();
  const tags = useTags();
  const progress = useProgress();

  /**
   * Filtering happens client-side.
   *
   * The list endpoint supports server-side filters, but the whole published
   * set is one page at this scale and filtering locally keeps typing instant.
   * When the set outgrows a page, move these into the query parameters that
   * `useProblems` already accepts — the shape is deliberately the same.
   */
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (problems.data ?? []).filter((p) => {
      if (needle && !p.title.toLowerCase().includes(needle)) return false;
      if (difficulty && p.difficulty !== difficulty) return false;
      if (status) {
        if (status === "solved") {
          // "Mastered" is a stronger form of solved, not a sibling of it.
          if (p.progress_state !== "solved" && p.progress_state !== "mastered") return false;
        } else if (p.progress_state !== status) {
          return false;
        }
      }
      if (activeTags.length > 0) {
        const slugs = p.tags.map((t) => t.slug);
        if (!activeTags.every((t) => slugs.includes(t))) return false;
      }
      return true;
    });
  }, [problems.data, query, difficulty, status, activeTags]);

  const hasFilters = Boolean(query || difficulty || status || activeTags.length);
  const reset = () => {
    setQuery("");
    setDifficulty("");
    setStatus("");
    setActiveTags([]);
  };

  const total = problems.data?.length ?? 0;
  const solved = progress.data?.problems_solved ?? 0;

  return (
    <GuardedPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} problem{total === 1 ? "" : "s"} · {solved} solved
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d}
            active={difficulty === d}
            onClick={() => setDifficulty((prev) => (prev === d ? "" : d))}
          >
            <DifficultyBadge difficulty={d} />
          </Chip>
        ))}

        <span className="mx-1 h-5 w-px bg-border" />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProgressState | "")}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {(tags.data?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Topics:</span>
          {tags.data!.map((t) => {
            const active = activeTags.includes(t.slug);
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() =>
                  setActiveTags((prev) =>
                    active ? prev.filter((x) => x !== t.slug) : [...prev, t.slug],
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary-muted text-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {t.name}
                {active && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
        {problems.isLoading ? (
          <div className="p-10 text-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : problems.isError ? (
          <div className="p-5">
            <ErrorState error={problems.error} onRetry={() => problems.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileQuestion}
              title={total === 0 ? "No problems published yet" : "Nothing matches those filters"}
              description={
                total === 0
                  ? "A problem becomes visible here once an administrator publishes a version with test data."
                  : "Try widening the difficulty, topic or status filters."
              }
              action={
                hasFilters ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-10 px-4 py-2.5 font-medium" aria-label="Status" />
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Topics</th>
                  <th className="px-4 py-2.5 font-medium">Difficulty</th>
                  <th className="px-4 py-2.5 font-medium">Acceptance</th>
                  <th className="px-4 py-2.5 font-medium">Solved by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.slug} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <StatusIcon status={p.progress_state} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to="/problems/$id"
                        params={{ id: p.slug }}
                        className="font-medium hover:text-primary"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          p.tags.map((t) => (
                            <span
                              key={t.slug}
                              className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                            >
                              {t.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DifficultyBadge difficulty={p.difficulty} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPercent(p.acceptance_rate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCount(p.solved_count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </GuardedPage>
  );
}
