import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { EmptyState, ErrorState, Spinner } from "@/components/primitives";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers, useChangeRole, useMe, useSetUserActive } from "@/lib/api/queries";
import type { Role } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin · Sodak-Tech" },
      {
        name: "description",
        content: "Manage user accounts, roles and activation state.",
      },
    ],
  }),
  component: AdminUsersPage,
});

const ROLES: Role[] = ["user", "problem_setter", "contest_manager", "admin", "super_admin"];

function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: me } = useMe();
  const users = useAdminUsers(search.trim());
  const changeRole = useChangeRole();
  const setActive = useSetUserActive();

  const canAssignRoles = me?.role === "super_admin";

  return (
    <AdminShell>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canAssignRoles
            ? "Assign roles and manage accounts."
            : "Only a Super Admin can change roles; you can still toggle accounts."}
        </p>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, email or name…"
          className="pl-9"
        />
      </div>

      {users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Rating</th>
                <th className="px-4 py-2.5 font-medium">Solved</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {users.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Spinner className="mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : (users.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="p-6">
                      <EmptyState
                        title={search ? "No users match" : "No users yet"}
                        description={
                          search
                            ? "Try a different search term."
                            : "Accounts are created by an administrator."
                        }
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                (users.data ?? []).map((u) => (
                  <tr
                    key={u.id}
                    className={cn("border-t border-border", !u.is_active && "opacity-60")}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.display_name || u.username}</p>
                      <p className="text-xs text-muted-foreground">
                        @{u.username} · {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {canAssignRoles ? (
                        <Select
                          value={u.role}
                          disabled={changeRole.isPending || u.id === me?.id}
                          onValueChange={(role) =>
                            changeRole.mutate({ userId: u.id, role: role as Role })
                          }
                        >
                          <SelectTrigger
                            className="h-8 w-40 text-xs"
                            title={
                              u.id === me?.id
                                ? "You cannot change your own role (§7.3)."
                                : "Change role"
                            }
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{ROLE_LABELS[u.role]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{u.rating}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {u.solved_count}
                      <span className="text-muted-foreground">/{u.submission_count}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.last_login_at ? formatRelative(u.last_login_at) : "Never signed in"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatRelative(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={setActive.isPending || u.id === me?.id}
                        onClick={() => setActive.mutate({ userId: u.id, isActive: !u.is_active })}
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                          u.is_active
                            ? "bg-success-muted text-success hover:bg-destructive-muted hover:text-destructive"
                            : "bg-destructive-muted text-destructive hover:bg-success-muted hover:text-success",
                        )}
                        title={
                          u.id === me?.id
                            ? "You cannot change your own account."
                            : u.is_active
                              ? "Deactivate (soft) — this keeps their history."
                              : "Activate account"
                        }
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
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
