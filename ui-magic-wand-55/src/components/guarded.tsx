import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/primitives";
import { useRequireAuth } from "@/lib/auth";

/**
 * An authenticated page.
 *
 * Wraps the shell so each route does not repeat the guard, and — more usefully
 * — so no route can forget it. While the session is being resolved it renders
 * a placeholder rather than the page: showing an empty dashboard first and
 * then redirecting looks like data was lost.
 */
export function GuardedPage({
  children,
  wide = false,
  requireRole,
}: {
  children: ReactNode;
  wide?: boolean;
  requireRole?: "admin" | "author";
}) {
  const { isReady, isLoading } = useRequireAuth({ requireRole });

  if (!isReady) {
    return (
      <AppShell wide={wide}>
        <div className="flex min-h-[50vh] items-center justify-center">
          {isLoading ? (
            <Spinner className="h-6 w-6 text-muted-foreground" />
          ) : (
            // Not loading and not ready means the redirect is already in
            // flight. Rendering nothing avoids a flash of the wrong page.
            <span className="sr-only">Redirecting</span>
          )}
        </div>
      </AppShell>
    );
  }

  return <AppShell wide={wide}>{children}</AppShell>;
}
