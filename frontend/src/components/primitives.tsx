import { CheckCircle2, Circle, CircleDashed, Star } from "lucide-react";

import type { Difficulty, ProgressState, Verdict } from "@/lib/api/types";
import {
  DIFFICULTY_LABELS,
  PROGRESS_LABELS,
  VERDICT_LABELS,
  verdictTone,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground font-mono text-sm font-bold text-background">
        S
      </span>
      <span className="text-sm font-semibold tracking-tight">Sodak-Tech</span>
    </div>
  );
}

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium",
        difficulty === "easy" && "text-success",
        difficulty === "medium" && "text-warning",
        difficulty === "hard" && "text-destructive",
        className,
      )}
    >
      {DIFFICULTY_LABELS[difficulty] ?? difficulty}
    </span>
  );
}

export function StatusIcon({ status }: { status: ProgressState }) {
  const label = PROGRESS_LABELS[status] ?? "To do";

  if (status === "solved" || status === "mastered") {
    return (
      <span title={label}>
        {status === "mastered" ? (
          <Star className="h-4 w-4 fill-success text-success" aria-label={label} />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-success" aria-label={label} />
        )}
      </span>
    );
  }
  if (status === "attempted") {
    return <CircleDashed className="h-4 w-4 text-warning" aria-label={label} />;
  }
  return <Circle className="h-4 w-4 text-muted-foreground/50" aria-label={label} />;
}

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  const tone = verdictTone(verdict);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "success" && "bg-success-muted text-success",
        tone === "warning" && "bg-warning-muted text-warning-foreground",
        tone === "danger" && "bg-destructive-muted text-destructive",
        tone === "muted" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {VERDICT_LABELS[verdict] ?? verdict}
    </span>
  );
}

export function Meter({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "easy" | "medium" | "hard";
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "primary" && "bg-primary",
          tone === "easy" && "bg-success",
          tone === "medium" && "bg-warning",
          tone === "hard" && "bg-destructive",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/**
 * What to show when a list is empty.
 *
 * A fresh install has no problems, no contests and no submissions, and that is
 * the state a first-time admin sees. A blank panel looks broken; this says
 * what is missing and what to do about it.
 */
export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-14 text-center">
      {Icon ? <Icon className="h-8 w-8 text-muted-foreground/60" /> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "The request could not be completed.";
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive-muted/40 px-5 py-4">
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
