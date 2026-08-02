import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag as TagIcon } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminTags, useCreateTag, useDeleteTag } from "@/lib/api/queries";

export const Route = createFileRoute("/admin/tags")({
  head: () => ({
    meta: [
      { title: "Tags — Admin · Sodak-Tech" },
      { name: "description", content: "Create and manage topic tags for problems." },
    ],
  }),
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const tags = useAdminTags();
  const create = useCreateTag();
  const deleteTag = useDeleteTag();

  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload: { name: string; slug?: string; description?: string } = {
      name: form.name.trim(),
      description: form.description,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    create.mutate(payload, {
      onSuccess: () => {
        toast.success(`Tag “${form.name}” created`);
        setForm({ name: "", slug: "", description: "" });
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Could not create the tag."),
    });
  };

  return (
    <AdminShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Topic labels problems are organised under.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="tag-name">Name</Label>
          <Input
            id="tag-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Arrays"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tag-slug">Slug (blank = derived)</Label>
          <Input
            id="tag-slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tag-desc">Description</Label>
          <Input
            id="tag-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={create.isPending} className="gap-1.5">
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>
      </form>

      {tags.isError ? (
        <ErrorState error={tags.error} onRetry={() => tags.refetch()} />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          {tags.isLoading ? (
            <div className="flex justify-center p-10">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : (tags.data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TagIcon}
                title="No tags yet"
                description="Tags group problems by topic and drive topic-mastery stats on the dashboard."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Slug</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Problems</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {(tags.data ?? []).map((tag) => (
                  <tr key={tag.slug} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{tag.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {tag.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tag.description || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tag.problem_count}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${tag.name}`}
                        disabled={deleteTag.isPending}
                        onClick={() =>
                          deleteTag.mutate(tag.slug, {
                            onSuccess: () => toast.success(`Deleted “${tag.name}”`),
                            onError: (error) =>
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Could not delete the tag.",
                              ),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminShell>
  );
}
