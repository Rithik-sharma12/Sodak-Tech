import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogOut, Shield, User as UserIcon } from "lucide-react";

import { Brand, Spinner } from "@/components/primitives";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout, useMe } from "@/lib/api/queries";
import { ROLE_LABELS, initialsOf, isPrivileged } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/problems", label: "Problems" },
  { to: "/contests", label: "Contests" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    // Navigate regardless of the outcome. If the request failed because the
    // session had already expired, keeping the user on an authenticated page
    // is the wrong answer.
    try {
      await logout.mutateAsync();
    } finally {
      navigate({ to: "/", replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-8 px-4 sm:px-6">
          <Link to="/dashboard">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
            {/* Rendering only. Every admin endpoint re-checks the role
                server-side, so hiding this link is a convenience, not a
                control (design doc §3.4). */}
            {isPrivileged(user) ? (
              <Link
                to="/admin"
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground font-medium" }}
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.rating} rating
              </span>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initialsOf(user)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">
                    {user?.display_name || user?.username || "Signed out"}
                  </p>
                  {user ? (
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[user.role]} · @{user.username}
                    </p>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {isPrivileged(user) ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin panel
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  disabled={logout.isPending}
                  className="cursor-pointer"
                >
                  {logout.isPending ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto px-4 py-8 sm:px-6",
          wide ? "max-w-[1600px]" : "max-w-[1400px]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
