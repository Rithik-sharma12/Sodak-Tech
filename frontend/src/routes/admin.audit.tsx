import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScrollText, Search } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import { useAuditLog } from "@/lib/api/queries";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Admin · Sodak-Tech" },
      {
        name: "description",
        content:
          "Append-only log of every privileged action. It is not editable or deletable by design (§8.3).",
      },
    ],
  }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const log = useAuditLog(search.trim());

  return (
    <AdminShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Append-only record of every privileged action. There is deliberately no way to edit or
          delete an entry — not even as Super Admin (§8.3).
        </p>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search summaries or actors…"
          className="pl-9"
        />
      </div>

      {log.isError ? (
        <ErrorState error={log.error} onRetry={() => log.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Summary</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Target</th>
                <th className="px-4 py-2.5 font-medium">IP</th>
                <th className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {log.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <Spinner className="mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : (log.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="p-6">
                      <EmptyState
                        icon={ScrollText}
                        title={search ? "No entries match" : "Nothing audited yet"}
                        description={
                          search
                            ? "Try a different search term."
                            : "Publishes, role changes, test data reads and contest transitions appear here."
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                (log.data ?? []).map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {entry.action}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="truncate">{entry.summary}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{entry.actor_label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.target_type}:{entry.target_id || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatRelative(entry.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
