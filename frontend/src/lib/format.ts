/**
 * Display helpers.
 *
 * The API speaks in machine values — `wrong_answer`, `easy`, `time_limit_ms` —
 * and the UI speaks in human ones. Doing that translation in one file means a
 * verdict is worded identically on the workspace, the submission page and the
 * history table, rather than three near-identical switch statements drifting
 * apart.
 */

import type { Difficulty, ProgressState, Verdict } from "./api/types";

export const VERDICT_LABELS: Record<Verdict, string> = {
  pending: "Pending",
  queued: "Queued",
  compiling: "Compiling",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  time_limit_exceeded: "Time Limit Exceeded",
  memory_limit_exceeded: "Memory Limit Exceeded",
  output_limit_exceeded: "Output Limit Exceeded",
  runtime_error: "Runtime Error",
  compile_error: "Compile Error",
  presentation_error: "Presentation Error",
  sandbox_violation: "Sandbox Violation",
  internal_error: "Judge Error",
  cancelled: "Cancelled",
};

export type VerdictTone = "success" | "warning" | "danger" | "muted";

export function verdictTone(verdict: Verdict): VerdictTone {
  if (verdict === "accepted") return "success";
  if (["pending", "queued", "compiling", "running"].includes(verdict)) return "muted";
  // Resource limits are the user's own doing and usually mean "nearly there";
  // a judge error is not their fault at all. Neither reads as a hard failure.
  if (
    ["time_limit_exceeded", "memory_limit_exceeded", "output_limit_exceeded"].includes(
      verdict,
    )
  ) {
    return "warning";
  }
  if (verdict === "internal_error" || verdict === "cancelled") return "muted";
  return "danger";
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const PROGRESS_LABELS: Record<ProgressState, string> = {
  not_attempted: "To do",
  attempted: "Attempted",
  solved: "Solved",
  mastered: "Mastered",
};

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  // The API reports acceptance as a 0–1 fraction; anything above 1 is already
  // a percentage and is passed through rather than multiplied again.
  const percent = value <= 1 ? value * 100 : value;
  return `${percent.toFixed(digits)}%`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatRuntime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}

export function formatMemory(kb: number | null | undefined): string {
  if (!kb) return "—";
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function formatScore(score: string | number | null | undefined): string {
  if (score === null || score === undefined) return "0";
  const value = typeof score === "string" ? Number.parseFloat(score) : score;
  if (Number.isNaN(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return "just now";
  if (abs < 3600) return RELATIVE.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return RELATIVE.format(Math.round(seconds / 3600), "hour");
  if (abs < 2_592_000) return RELATIVE.format(Math.round(seconds / 86_400), "day");
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Countdown text from a server-anchored offset.
 *
 * §7.2 requires countdowns be derived from a server-provided time, never the
 * browser clock: a user whose clock is wrong — or who sets it deliberately —
 * must not see a contest open early.
 */
export function formatCountdown(targetIso: string, serverOffsetMs: number): string {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return "—";

  const remaining = target - (Date.now() + serverOffsetMs);
  if (remaining <= 0) return "now";

  const totalMinutes = Math.floor(remaining / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Milliseconds to add to the browser clock to get server time. */
export function serverOffset(serverTimeIso: string | undefined): number {
  if (!serverTimeIso) return 0;
  const server = new Date(serverTimeIso).getTime();
  return Number.isNaN(server) ? 0 : server - Date.now();
}
