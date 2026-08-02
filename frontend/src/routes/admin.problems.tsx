import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { DifficultyBadge, EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useAdminProblems, useDeleteProblem } from "@/lib/api/queries";
import { formatCount, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/problems")({
  head: () => ({
    meta: [
      { title: "Problems — Admin · Sodak-Tech" },
      {
        name: "description",
        content: "Author problems, manage statements, versions and test data.",
      },
    ],
  }),
  component: AdminProblemsPage,
});

function AdminProblemsPage() {
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const deleteProblem = useDeleteProblem();

  const problems = useAdminProblems(search.trim());

  const problemsToDelete = problems.data?.find((p) => p.slug === pendingDelete);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author problems, manage statements, versions and test data.
          </p>
        </header>
        <Button asChild className="gap-1.5">
          <Link to="/admin/problems/new">
            <Plus className="h-4 w-4" />
            New problem
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or slug…"
          className="pl-9"
        />
      </div>

      {problems.isError ? (
        <ErrorState error={problems.error} onRetry={() => problems.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Problem</th>
                <th className="px-4 py-2.5 font-medium">Difficulty</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Versions</th>
                <th className="px-4 py-2.5 font-medium">Solved</th>
                <th className="px-4 py-2.5 font-medium">Author</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {problems.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Spinner className="mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : (problems.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="p-6">
                      <EmptyState
                        title={search ? "No problems match" : "No problems yet"}
                        description={
                          search
                            ? "Try a different search term."
                            : "Create a problem, then add a version with test data to publish it."
                        }
                        action={
                          !search ? (
                            <Button asChild size="sm">
                              <Link to="/admin/problems/new">New problem</Link>
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                (problems.data ?? []).map((p) => (
                  <tr key={p.slug} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        to="/admin/problems/$slug"
                        params={{ slug: p.slug }}
                        className="font-medium hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <DifficultyBadge difficulty={p.difficulty} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          p.is_public && p.is_submittable
                            ? "bg-success-muted text-success"
                            : p.is_public
                              ? "bg-primary-muted text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {p.is_public && p.is_submittable
                          ? "Live"
                          : p.is_public
                            ? "Public"
                            : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.version_count}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {formatCount(p.solved_count)}
                      <span className="text-muted-foreground">/{formatCount(p.attempt_count)}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.author_username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatRelative(p.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${p.title}`}
                        onClick={() => setPendingDelete(p.slug)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{problemsToDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The problem is soft-deleted: past submissions keep resolving and the slug stays
              reserved (§9). This cannot be undone from the panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProblem.isPending}
              onClick={() => {
                if (pendingDelete) deleteProblem.mutate(pendingDelete);
              }}
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
