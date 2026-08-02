import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  ListOrdered,
  ScrollText,
  ShieldAlert,
  Tags,
  Trophy,
  Users,
} from "lucide-react";

import { Spinner } from "@/components/primitives";
import { useLogout } from "@/lib/api/queries";
import { ROLE_LABELS, useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Admin area chrome.
 *
 * The sidebar is deliberately unlike the student header: amber active markers,
 * a fixed 220px rail, and a permanently visible sandbox warning. The warning is
 * not dismissible because the judge genuinely is unsandboxed (§3.1 of the
 * design doc) — this is the single most important operational caveat the
 * product carries, and it must survive a session, not one render.
 *
 * Like GuardedPage, the guard here is about what to draw. Every admin endpoint
 * re-checks the role server-side (§3.4).
 */
const NAV: {
  to:
    | "/admin"
    | "/admin/problems"
    | "/admin/contests"
    | "/admin/users"
    | "/admin/tags"
    | "/admin/audit"
    | "/admin/health";
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/problems", label: "Problems", icon: ListOrdered },
  { to: "/admin/contests", label: "Contests", icon: Trophy },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/tags", label: "Tags", icon: Tags },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
  { to: "/admin/health", label: "System health", icon: Activity },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading, isReady } = useRequireAuth({ requireRole: "admin" });
  const logout = useLogout();
  const navigate = useNavigate();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/admin";

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate({ to: "/", search: { next: undefined }, replace: true });
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {isLoading ? (
          <Spinner className="h-6 w-6 text-muted-foreground" />
        ) : (
          <span className="sr-only">Redirecting</span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-55 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-3 px-5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-warning font-mono text-sm font-bold text-background">
            S
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Administration</p>
            <p className="text-[11px] text-muted-foreground">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent font-medium text-foreground",
                )}
              >
                {active ? (
                  <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-warning" />
                ) : null}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/dashboard"
            className="flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit admin
          </Link>
        </div>
      </aside>

      <div className="pl-55">
        <header className="flex h-14 items-center justify-end gap-3 border-b border-border bg-card/90 px-6 backdrop-blur">
          {user ? (
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.username}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={logout.isPending}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {logout.isPending ? "Signing out…" : "Sign out"}
          </button>
        </header>

        <main className="px-8 py-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border-l-4 border-warning bg-warning-muted px-4 py-3"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div className="text-sm">
                <p className="font-semibold text-warning-foreground">Judging is not sandboxed</p>
                <p className="text-warning-foreground/90">
                  Submitted code runs in a subprocess on this host with no isolation from the
                  filesystem, network, or database. Safe for a controlled demo; not safe for
                  untrusted users.
                </p>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
