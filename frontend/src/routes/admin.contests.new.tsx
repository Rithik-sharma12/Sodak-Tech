import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
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
import { useCreateContest } from "@/lib/api/queries";
import { fromLocalInput, toLocalInput } from "@/lib/format";
import type { ContestWrite, ScoringMode } from "@/lib/api/types";

export const Route = createFileRoute("/admin/contests/new")({
  head: () => ({
    meta: [{ title: "New contest — Admin · Sodak-Tech" }],
  }),
  component: AdminNewContestPage,
});

function AdminNewContestPage() {
  const navigate = useNavigate();
  const create = useCreateContest();

  const defaultStart = new Date();
  defaultStart.setUTCHours(defaultStart.getUTCHours() + 24, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 90 * 60_000);

  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    scoring_mode: "partial" as ScoringMode,
    starts_at: toLocalInput(defaultStart.toISOString()),
    ends_at: toLocalInput(defaultEnd.toISOString()),
    freeze_at: "",
    grace_period_seconds: 0,
    penalty_minutes_per_wrong: 20,
    is_rated: false,
    is_public: false,
    rules_text: "",
    tiebreak_rule: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: ContestWrite = {
      title: form.title,
      description: form.description,
      scoring_mode: form.scoring_mode,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      freeze_at: form.freeze_at ? fromLocalInput(form.freeze_at) : null,
      grace_period_seconds: form.grace_period_seconds,
      penalty_minutes_per_wrong: form.penalty_minutes_per_wrong,
      is_rated: form.is_rated,
      is_public: form.is_public,
      rules_text: form.rules_text,
      tiebreak_rule: form.tiebreak_rule,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    create.mutate(payload, {
      onSuccess: (contest) => {
        toast.success("Contest created");
        navigate({ to: "/admin/contests/$slug", params: { slug: contest.slug } });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Could not create the contest.");
      },
    });
  };

  return (
    <AdminShell>
      <Link
        to="/admin/contests"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Contests
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New contest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scheduling first. Attach problems after creating the draft.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border border-border bg-card p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Weekly Challenge 143"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">
              Slug{" "}
              <span className="font-normal text-muted-foreground">
                (blank = derived from title)
              </span>
            </Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="starts_at">Starts</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ends_at">Ends</Label>
            <Input
              id="ends_at"
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeze_at">Freeze at (optional)</Label>
            <Input
              id="freeze_at"
              type="datetime-local"
              value={form.freeze_at}
              onChange={(e) => set("freeze_at", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scoring_mode">Scoring mode</Label>
            <Select
              value={form.scoring_mode}
              onValueChange={(v) => set("scoring_mode", v as ScoringMode)}
            >
              <SelectTrigger id="scoring_mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="partial">Partial (sum of best scores)</SelectItem>
                <SelectItem value="icpc">ICPC (solved count, then penalty)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="grace">Grace period (seconds)</Label>
            <Input
              id="grace"
              type="number"
              min={0}
              value={form.grace_period_seconds}
              onChange={(e) => set("grace_period_seconds", Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="penalty">Penalty per wrong submit (min)</Label>
            <Input
              id="penalty"
              type="number"
              min={0}
              value={form.penalty_minutes_per_wrong}
              onChange={(e) => set("penalty_minutes_per_wrong", Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rules">Rules text</Label>
            <Textarea
              id="rules"
              value={form.rules_text}
              onChange={(e) => set("rules_text", e.target.value)}
              rows={4}
              placeholder="Published rules before every contest — §9."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiebreak">Tiebreak rule</Label>
            <Textarea
              id="tiebreak"
              value={form.tiebreak_rule}
              onChange={(e) => set("tiebreak_rule", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Switch checked={form.is_rated} onCheckedChange={(v) => set("is_rated", v)} />
              Rated
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Switch checked={form.is_public} onCheckedChange={(v) => set("is_public", v)} />
              Public
            </label>
          </div>

          <Button type="submit" disabled={create.isPending} className="gap-1.5">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create contest
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
