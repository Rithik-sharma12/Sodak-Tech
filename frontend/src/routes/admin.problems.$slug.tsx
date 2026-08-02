import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { TestDataEditor } from "@/components/admin/test-data-editor";
import { DifficultyBadge, ErrorState, Spinner } from "@/components/primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminProblem,
  useAdminTags,
  useCreateVersion,
  useDeleteProblem,
  usePublishVersion,
  useUpdateProblem,
} from "@/lib/api/queries";
import type { Difficulty } from "@/lib/api/types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/problems/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Edit ${params.slug} — Admin · Sodak-Tech` }],
  }),
  component: AdminProblemDetailPage,
});

function AdminProblemDetailPage() {
  const { slug } = Route.useParams();
  const problem = useAdminProblem(slug);
  const deleteProblem = useDeleteProblem();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (problem.isError) {
    return (
      <AdminShell>
        <ErrorState error={problem.error} onRetry={() => problem.refetch()} />
      </AdminShell>
    );
  }
  if (problem.isLoading || !problem.data) {
    return (
      <AdminShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  const data = problem.data;

  return (
    <AdminShell>
      <Link
        to="/admin/problems"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Problems
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
            <DifficultyBadge difficulty={data.difficulty} />
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                data.is_public && data.is_submittable
                  ? "bg-success-muted text-success"
                  : data.is_public
                    ? "bg-primary-muted text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {data.is_public && data.is_submittable ? "Live" : data.is_public ? "Public" : "Draft"}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            /{data.slug} · by {data.author_username}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete problem
        </Button>
      </header>

      <Tabs defaultValue="statement">
        <TabsList>
          <TabsTrigger value="statement">Statement</TabsTrigger>
          <TabsTrigger value="versions">Versions &amp; test data</TabsTrigger>
        </TabsList>
        <TabsContent value="statement" className="mt-4">
          <StatementEditor problem={data} />
        </TabsContent>
        <TabsContent value="versions" className="mt-4">
          <VersionsSection slug={data.slug} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{data.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft delete (§9): past submissions keep resolving and the slug stays reserved. This
              cannot be undone from the panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProblem.isPending}
              onClick={() =>
                deleteProblem.mutate(data.slug, {
                  onSuccess: () => navigate({ to: "/admin/problems" }),
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProblem.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

function StatementEditor({
  problem,
}: {
  problem: NonNullable<ReturnType<typeof useAdminProblem>["data"]>;
}) {
  const update = useUpdateProblem(problem.slug);
  const tags = useAdminTags();
  const [form, setForm] = useState({
    title: problem.title,
    statement: problem.statement,
    input_format: problem.input_format,
    output_format: problem.output_format,
    constraints: problem.constraints,
    notes: problem.notes,
    difficulty: problem.difficulty,
    is_public: problem.is_public,
    tag_slugs: problem.tags.map((t) => t.slug),
  });

  // The row may have changed (a reload, a second tab); resync local state so a
  // stale form cannot silently overwrite it.
  useEffect(() => {
    setForm({
      title: problem.title,
      statement: problem.statement,
      input_format: problem.input_format,
      output_format: problem.output_format,
      constraints: problem.constraints,
      notes: problem.notes,
      difficulty: problem.difficulty,
      is_public: problem.is_public,
      tag_slugs: problem.tags.map((t) => t.slug),
    });
  }, [
    problem.title,
    problem.statement,
    problem.input_format,
    problem.output_format,
    problem.constraints,
    problem.notes,
    problem.difficulty,
    problem.is_public,
    problem.tags,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    update.mutate(
      {
        ...form,
        // §7.3 optimistic concurrency: a conflicting edit is a 409, never a
        // silent overwrite. Echo the row_version we last saw.
        expected_row_version: problem.row_version,
      },
      {
        onSuccess: () => toast.success("Statement saved"),
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not save. If someone edited this in another tab, reload and retry.",
          );
        },
      },
    );
  };

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value as Difficulty)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="statement">Statement</Label>
        <Textarea
          id="statement"
          value={form.statement}
          onChange={(e) => set("statement", e.target.value)}
          rows={10}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="input_format">Input format</Label>
          <Textarea
            id="input_format"
            value={form.input_format}
            onChange={(e) => set("input_format", e.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="output_format">Output format</Label>
          <Textarea
            id="output_format"
            value={form.output_format}
            onChange={(e) => set("output_format", e.target.value)}
            rows={4}
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
            rows={4}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={4}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Tags</span>
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
                  : "border-border text-muted-foreground",
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={form.is_public} onCheckedChange={(v) => set("is_public", v)} />
            Public
          </label>
          <Button type="submit" disabled={update.isPending} className="gap-1.5">
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save statement
          </Button>
        </div>
      </div>
    </form>
  );
}

function VersionsSection({ slug }: { slug: string }) {
  const problem = useAdminProblem(slug);
  const create = useCreateVersion(slug);
  const publish = usePublishVersion(slug);
  const [showEditor, setShowEditor] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (!problem.data) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  const versions = [...problem.data.versions].sort((a, b) => b.version_number - a.version_number);

  const toggle = (versionNumber: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(versionNumber)) next.delete(versionNumber);
      else next.add(versionNumber);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {versions.length} version{versions.length === 1 ? "" : "s"} — the newest live version
          decides what learners solve.
        </p>
        <Button className="gap-1.5" onClick={() => setShowEditor((v) => !v)}>
          {showEditor ? <ChevronRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showEditor ? "Hide editor" : "New version"}
        </Button>
      </div>

      {showEditor ? (
        <TestDataEditor
          submitting={create.isPending}
          onSubmit={(payload, publishFlag) =>
            create.mutate(payload, {
              onSuccess: () => {
                toast.success(
                  publishFlag
                    ? "Version created and published"
                    : "Draft version saved — publish it when ready",
                );
                setShowEditor(false);
              },
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "Could not save the version."),
            })
          }
        />
      ) : null}

      <div className="space-y-3">
        {versions.map((version) => {
          const isOpen = expanded.has(version.version_number);
          return (
            <div
              key={version.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => toggle(version.version_number)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-mono text-sm font-semibold">v{version.version_number}</span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    version.is_published
                      ? "bg-success-muted text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {version.is_published ? "Published" : "Draft"}
                </span>
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  {version.time_limit_ms}ms · {version.memory_limit_mb}MB ·{" "}
                  {version.comparison_mode}
                  {version.judge_mode === "signature" ? " · signature" : ""}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {version.is_published && version.published_at
                    ? `Published ${formatDateTime(version.published_at)}`
                    : version.change_note || `Created ${formatRelative(version.created_at)}`}
                </span>
              </button>

              {isOpen ? (
                <div className="space-y-4 border-t border-border bg-muted/40 p-4">
                  {version.change_note ? (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Change note:</span> {version.change_note}
                    </p>
                  ) : null}
                  {!version.is_published ? (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        disabled={publish.isPending}
                        onClick={() =>
                          publish.mutate(version.version_number, {
                            onSuccess: () => toast.success(`Published v${version.version_number}`),
                            onError: (error) =>
                              toast.error(
                                error instanceof Error ? error.message : "Could not publish.",
                              ),
                          })
                        }
                      >
                        Publish this version
                      </Button>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {version.test_groups.map((group) => (
                      <div key={group.id} className="rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <span className="text-sm font-medium">{group.name}</span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              group.is_sample
                                ? "bg-success-muted text-success"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {group.is_sample ? "Sample" : "Hidden"}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            weight {group.weight}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {group.test_cases.length} case
                            {group.test_cases.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
                          {group.test_cases.map((testCase) => (
                            <div key={testCase.id} className="rounded-md bg-muted/50 p-2">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Case {testCase.order !== undefined ? testCase.order + 1 : ""}
                              </p>
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                                {testCase.input_data}
                              </pre>
                              <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                Expected
                              </p>
                              <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                                {testCase.expected_output}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
