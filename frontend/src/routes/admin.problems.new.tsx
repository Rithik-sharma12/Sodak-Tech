import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { DifficultyBadge, Spinner } from "@/components/primitives";
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
import { useAdminTags, useCreateProblem } from "@/lib/api/queries";
import type { Difficulty } from "@/lib/api/types";
import type { ProblemWrite } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/problems/new")({
  head: () => ({
    meta: [{ title: "New problem — Admin · Sodak-Tech" }],
  }),
  component: AdminNewProblemPage,
});

const INITIAL = {
  slug: "",
  title: "",
  statement: "",
  input_format: "",
  output_format: "",
  constraints: "",
  notes: "",
  difficulty: "easy" as Difficulty,
  is_public: false,
  tag_slugs: [] as string[],
};

function AdminNewProblemPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const tags = useAdminTags();
  const create = useCreateProblem();

  const set = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: ProblemWrite = {
      title: form.title,
      statement: form.statement,
      input_format: form.input_format,
      output_format: form.output_format,
      constraints: form.constraints,
      notes: form.notes,
      difficulty: form.difficulty,
      is_public: form.is_public,
      tag_slugs: form.tag_slugs,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    create.mutate(payload, {
      onSuccess: (problem) => {
        toast.success("Problem created");
        navigate({ to: "/admin/problems/$slug", params: { slug: problem.slug } });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Could not create the problem.");
      },
    });
  };

  return (
    <AdminShell>
      <Link
        to="/admin/problems"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Problems
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New problem</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The statement first. Judging limits and test data are added separately as an immutable
          version.
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
              placeholder="Two Sum"
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
              placeholder="two-sum"
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="statement">Statement</Label>
          <Textarea
            id="statement"
            value={form.statement}
            onChange={(e) => set("statement", e.target.value)}
            rows={8}
            placeholder="Markdown statement, examples and all."
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="input_format">Input format</Label>
            <Textarea
              id="input_format"
              value={form.input_format}
              onChange={(e) => set("input_format", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="output_format">Output format</Label>
            <Textarea
              id="output_format"
              value={form.output_format}
              onChange={(e) => set("output_format", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea
              id="constraints"
              value={form.constraints}
              onChange={(e) => set("constraints", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={form.difficulty}
              onValueChange={(v) => set("difficulty", v as Difficulty)}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <DifficultyBadge difficulty="easy" /> · Easy
                </SelectItem>
                <SelectItem value="medium">
                  <DifficultyBadge difficulty="medium" /> · Medium
                </SelectItem>
                <SelectItem value="hard">
                  <DifficultyBadge difficulty="hard" /> · Hard
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Tags</Label>
            {tags.isLoading ? (
              <div className="flex h-9 items-center">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (tags.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tags yet — add some on the tags page.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(tags.data ?? []).map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() =>
                      set(
                        "tag_slugs",
                        form.tag_slugs.includes(tag.slug)
                          ? form.tag_slugs.filter((s) => s !== tag.slug)
                          : [...form.tag_slugs, tag.slug],
                      )
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      form.tag_slugs.includes(tag.slug)
                        ? "border-primary bg-primary-muted text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Switch checked={form.is_public} onCheckedChange={(v) => set("is_public", v)} />
            <span>
              Public
              <span className="block text-xs text-muted-foreground">
                Not solvable until a version is published.
              </span>
            </span>
          </label>

          <Button type="submit" disabled={create.isPending} className="gap-1.5">
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create problem
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
