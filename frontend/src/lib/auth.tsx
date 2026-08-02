/**
 * Client-side auth state and route guarding.
 *
 * Everything here is for *rendering*, never for access control. §3.4 of the
 * design doc is blunt about it — "Hiding a control in the UI is not access
 * control" — and the stack doc repeats it: the admin panel is JavaScript, so
 * anyone holding a privileged session can call the API directly.
 *
 * So the guard below decides what to *draw*. Every endpoint it draws a button
 * for re-checks the caller's role server-side, and would reject the request if
 * this file were bypassed entirely.
 */

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { useMe } from "./api/queries";
import { PRIVILEGED_ROLES, type Role, type User } from "./api/types";

export function isPrivileged(user: User | null | undefined): boolean {
  return Boolean(user && PRIVILEGED_ROLES.includes(user.role));
}

export function isAdmin(user: User | null | undefined): boolean {
  return Boolean(user && (user.role === "admin" || user.role === "super_admin"));
}

export function canAuthorProblems(user: User | null | undefined): boolean {
  return Boolean(
    user &&
    (user.role === "problem_setter" || user.role === "admin" || user.role === "super_admin"),
  );
}

export const ROLE_LABELS: Record<Role, string> = {
  user: "Learner",
  problem_setter: "Problem Setter",
  contest_manager: "Contest Manager",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function initialsOf(user: User | null | undefined): string {
  if (!user) return "?";
  const source = user.display_name?.trim() || user.username;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface GuardResult {
  user: User | null | undefined;
  isLoading: boolean;
  /** True once we know who the user is and they are allowed to be here. */
  isReady: boolean;
}

/**
 * Redirect to sign-in unless a session exists.
 *
 * The redirect carries the current path so a user who followed a deep link to
 * a problem lands back on that problem after signing in, rather than on a
 * dashboard with no idea what they lost.
 */
export function useRequireAuth(options: { requireRole?: "admin" | "author" } = {}): GuardResult {
  const { data: user, isLoading } = useMe();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const allowed = !user
    ? false
    : options.requireRole === "admin"
      ? isAdmin(user)
      : options.requireRole === "author"
        ? canAuthorProblems(user)
        : true;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate({
        to: "/",
        search: pathname && pathname !== "/" ? { next: pathname } : { next: undefined },
        replace: true,
      });
      return;
    }

    // Signed in but not permitted: send them somewhere they can use rather
    // than to the login page, which would imply their session was the problem.
    if (!allowed) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isLoading, user, allowed, navigate, pathname]);

  return { user, isLoading, isReady: !isLoading && Boolean(user) && allowed };
}
