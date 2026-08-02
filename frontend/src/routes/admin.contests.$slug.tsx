import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Paperclip, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { DifficultyBadge, ErrorState, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminContest,
  useAdminProblems,
  useAttachContestProblem,
  useDetachContestProblem,
  useTransitionContest,
  useUpdateContest,
} from "@/lib/api/queries";
import type { ContestState } from "@/lib/api/types";
import {
  CONTEST_STATE_LABELS,
  contestStateTone,
  formatDateTime,
  fromLocalInput,
  toLocalInput,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/contests/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Contest ${params.slug} — Admin · Sodak-Tech` }],
  }),
  component: AdminContestDetailPage,
});

function transitionLabel(target: ContestState, current: ContestState): string {
  if (current === "paused" && (target === "running" || target === "frozen")) {
    return `Resume to ${CONTEST_STATE_LABELS[target]}`;
  }
  switch (target) {
    case "published":
      return "Publish";
    case "draft":
      return "Back to draft";
    case "running":
      return "Start contest";
    case "frozen":
      return "Freeze standings";
    case "paused":
      return "Pause contest";
    case "ended":
      return "End contest";
    case "provisional":
      return "Provisional standings";
    case "final":
      return "Finalise results";
    default:
      return target;
  }
}

function AdminContestDetailPage() {
  const { slug } = Route.useParams();
  const contest = useAdminContest(slug);
  const update = useUpdateContest(slug);
  const transition = useTransitionContest();
  const attach = useAttachContestProblem(slug);
  const detach = useDetachContestProblem(slug);
  const problems = useAdminProblems("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    freeze_at: "",
    grace_period_seconds: 0,
    penalty_minutes_per_wrong: 20,
    scoring_mode: "partial" as "partial" | "icpc",
    is_rated: false,
    is_public: false,
    rules_text: "",
    tiebreak_rule: "",
  });

  const [attachForm, setAttachForm] = useState({
    problem_slug: "",
    label: "A",
    order: 0,
    points: 100,
  });

  const data = contest.data;

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title,
      description: data.description,
      starts_at: toLocalInput(data.starts_at),
      ends_at: toLocalInput(data.ends_at),
      freeze_at: data.freeze_at ? toLocalInput(data.freeze_at) : "",
      grace_period_seconds: data.grace_period_seconds,
      penalty_minutes_per_wrong: data.penalty_minutes_per_wrong,
      scoring_mode: data.scoring_mode,
      is_rated: data.is_rated,
      is_public: data.is_public,
      rules_text: data.rules_text,
      tiebreak_rule: data.tiebreak_rule,
    });
  }, [data]);

  if (contest.isError) {
    return (
      <AdminShell>
        <ErrorState error={contest.error} onRetry={() => contest.refetch()} />
      </AdminShell>
    );
  }
  if (!data) {
    return (
      <AdminShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  const tone = contestStateTone(data.state);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    update.mutate(
      {
        ...form,
        starts_at: fromLocalInput(form.starts_at),
        ends_at: fromLocalInput(form.ends_at),
        freeze_at: form.freeze_at ? fromLocalInput(form.freeze_at) : null,
        expected_row_version: data.row_version,
      },
      {
        onSuccess: () => toast.success("Contest saved"),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not save. If someone else edited this contest, reload and retry.",
          ),
      },
    );
  };

  const handleTransition = (toState: ContestState) => {
    transition.mutate(
      { slug, toState },
      {
        onSuccess: () => toast.success(`Moved to ${CONTEST_STATE_LABELS[toState]}`),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Transition failed."),
      },
    );
  };

  const handleAttach = (event: React.FormEvent) => {
    event.preventDefault();
    attach.mutate(attachForm, {
      onSuccess: () => {
        toast.success("Problem attached");
        setAttachForm((f) => ({ ...f, problem_slug: "" }));
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not attach."),
    });
  };

  const publishedSlugs = problems.data?.filter((p) => p.is_submittable).map((p) => p.slug);

  return (
    <AdminShell>
      <Link
        to="/admin/contests"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Contests
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                tone === "success" && "bg-success-muted text-success",
                tone === "warning" && "bg-warning-muted text-warning-foreground",
                tone === "muted" && "bg-muted text-muted-foreground",
              )}
            >
              {CONTEST_STATE_LABELS[data.state]}
            </span>
            {data.is_rated ? (
              <span className="rounded-full bg-primary-muted px-2 py-0.5 text-xs font-medium text-primary">
                Rated
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /{data.slug} · by {data.owner_username}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.allowed_transitions.map((target) => (
            <Button
              key={target}
              size="sm"
              variant={target === "final" ? "destructive" : "outline"}
              disabled={transition.isPending}
              onClick={() => handleTransition(target)}
              className="gap-1.5"
            >
              {transition.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {transitionLabel(target, data.state)}
            </Button>
          ))}
          {data.allowed_transitions.length === 0 ? (
            <span className="text-xs text-muted-foreground">Terminal state — no transitions</span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-lg border border-border bg-card p-5 lg:col-span-2"
        >
          <h2 className="text-sm font-semibold">Schedule &amp; rules</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scoring">Scoring mode</Label>
              <Select
                value={form.scoring_mode}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, scoring_mode: v as "partial" | "icpc" }))
                }
              >
                <SelectTrigger id="scoring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Partial (sum of best scores)</SelectItem>
                  <SelectItem value="icpc">ICPC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="starts_at">Starts</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ends_at">Ends</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freeze_at">Freeze at (optional)</Label>
              <Input
                id="freeze_at"
                type="datetime-local"
                value={form.freeze_at}
                onChange={(e) => setForm((f) => ({ ...f, freeze_at: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grace">Grace period (seconds)</Label>
              <Input
                id="grace"
                type="number"
                min={0}
                value={form.grace_period_seconds}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grace_period_seconds: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="penalty">Penalty per wrong submit (min)</Label>
              <Input
                id="penalty"
                type="number"
                min={0}
                value={form.penalty_minutes_per_wrong}
                onChange={(e) =>
                  setForm((f) => ({ ...f, penalty_minutes_per_wrong: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rules">Rules text</Label>
            <Textarea
              id="rules"
              value={form.rules_text}
              onChange={(e) => setForm((f) => ({ ...f, rules_text: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiebreak">Tiebreak rule</Label>
            <Textarea
              id="tiebreak"
              value={form.tiebreak_rule}
              onChange={(e) => setForm((f) => ({ ...f, tiebreak_rule: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-5">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Switch
                  checked={form.is_rated}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_rated: v }))}
                />
                Rated
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Switch
                  checked={form.is_public}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_public: v }))}
                />
                Public
              </label>
            </div>
            <Button type="submit" disabled={update.isPending} className="gap-1.5">
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Problem set</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Fixed once the contest leaves “published”. A problem pins the version that is current
              at attach time.
            </p>
            <ul className="mt-4 space-y-2">
              {data.problems.length === 0 ? (
                <li className="text-sm text-muted-foreground">No problems attached yet.</li>
              ) : (
                data.problems.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-xs font-semibold">
                      {p.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/admin/problems/$slug"
                        params={{ slug: p.problem_slug }}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {p.problem_title}
                      </Link>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DifficultyBadge difficulty={p.problem_difficulty} />v{p.version_number} ·{" "}
                        {p.points} pts
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Detach ${p.problem_slug}`}
                      disabled={detach.isPending}
                      onClick={() =>
                        detach.mutate(p.problem_slug, {
                          onSuccess: () => toast.success("Problem detached"),
                          onError: (error) =>
                            toast.error(
                              error instanceof Error ? error.message : "Could not detach.",
                            ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))
              )}
            </ul>

            <form onSubmit={handleAttach} className="mt-4 space-y-3 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">Attach a problem</p>
              <div className="space-y-1.5">
                <Label htmlFor="problem_slug" className="text-xs">
                  Problem slug
                </Label>
                <Input
                  id="problem_slug"
                  value={attachForm.problem_slug}
                  onChange={(e) => setAttachForm((f) => ({ ...f, problem_slug: e.target.value }))}
                  list="problem-slugs"
                  placeholder="two-sum"
                  className="font-mono"
                  required
                />
                <datalist id="problem-slugs">
                  {(publishedSlugs ?? []).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={attachForm.label}
                    onChange={(e) => setAttachForm((f) => ({ ...f, label: e.target.value }))}
                    className="font-mono"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={attachForm.order}
                    onChange={(e) =>
                      setAttachForm((f) => ({ ...f, order: Number(e.target.value) }))
                    }
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Points</Label>
                  <Input
                    type="number"
                    min={1}
                    value={attachForm.points}
                    onChange={(e) =>
                      setAttachForm((f) => ({ ...f, points: Number(e.target.value) }))
                    }
                    className="font-mono"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={attach.isPending}
                className="w-full gap-1.5"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {attach.isPending ? "Attaching…" : "Attach problem"}
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Timing</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Starts</dt>
                <dd className="font-mono text-xs">{formatDateTime(data.starts_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ends</dt>
                <dd className="font-mono text-xs">{formatDateTime(data.ends_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Freeze</dt>
                <dd className="font-mono text-xs">
                  {data.freeze_at ? formatDateTime(data.freeze_at) : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Registered</dt>
                <dd className="font-mono text-xs">{data.registration_count}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
