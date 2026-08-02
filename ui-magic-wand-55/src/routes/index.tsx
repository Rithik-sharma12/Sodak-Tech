import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Terminal, Timer } from "lucide-react";
import { Brand, Spinner } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { primeCsrf } from "@/lib/api/client";
import { useLogin, useMe } from "@/lib/api/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Sodak-Tech Online Judge" },
      {
        name: "description",
        content:
          "Sign in to Sodak-Tech to practice algorithms, enter timed contests and track your rating.",
      },
      { property: "og:title", content: "Sign in — Sodak-Tech Online Judge" },
      {
        property: "og:description",
        content:
          "Sign in to Sodak-Tech to practice algorithms, enter timed contests and track your rating.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: LoginPage,
});

const features = [
  {
    icon: Terminal,
    title: "Real-time editor",
    body: "Write and run code without leaving the browser",
  },
  {
    icon: CheckCircle2,
    title: "Instant verdicts",
    body: "Automated judging against hidden test cases",
  },
  {
    icon: Timer,
    title: "Timed contests",
    body: "Compete with live standings and ratings",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const { data: user, isLoading: checkingSession } = useMe();
  const login = useLogin();

  // The API refuses a write without a CSRF cookie, and it only issues one on
  // request. Asking for it while the user is still typing means the first
  // sign-in attempt is not the one that pays for the round trip.
  useEffect(() => {
    void primeCsrf();
  }, []);

  // `next` carries the page the guard bounced them from, so a deep link to a
  // problem survives signing in.
  const destination = typeof search.next === "string" ? search.next : "/dashboard";

  useEffect(() => {
    if (user) navigate({ to: destination, replace: true });
  }, [user, destination, navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (login.isPending) return;
    login.mutate(
      { email: email.trim(), password },
      { onSuccess: () => navigate({ to: destination, replace: true }) },
    );
  };

  // One message for both "no such account" and "wrong password" — the API
  // deliberately does not distinguish them, because doing so turns this form
  // into an account-existence oracle. Don't reword it per failure here either.
  const errorMessage =
    login.error instanceof Error
      ? login.error.message
      : login.isError
        ? "Incorrect email or password."
        : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <section className="dot-grid relative hidden flex-col justify-between p-10 lg:flex">
        <Brand />
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">Practice. Compete. Improve.</h1>
          <p className="mt-2 text-muted-foreground">
            Sharpen your algorithms with instant automated feedback.
          </p>
          <ul className="mt-10 space-y-7">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card">
                  <f.icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{f.title}</span>
                  <span className="block text-sm text-muted-foreground">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">
          Sri Sai University · Department of Computer Science
        </p>
      </section>

      <section className="flex flex-col justify-center border-l border-border bg-card px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Continue to your dashboard</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={login.isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={login.isPending}
                  className={cn("pr-10", errorMessage && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {errorMessage && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox id="remember" />
                Remember me
              </label>
              {/* Password reset needs an endpoint and an email sender, and
                  neither exists yet. Shown disabled with a reason rather than
                  as a live control that silently does nothing. */}
              <span
                className="cursor-not-allowed text-sm text-muted-foreground/70"
                title="Password reset needs email delivery, which is not configured yet."
              >
                Forgot password?
              </span>
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending || checkingSession}>
              {login.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Signing in
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Accounts are created by an administrator. Ask yours for access.
          </p>
        </div>
      </section>
    </div>
  );
}
