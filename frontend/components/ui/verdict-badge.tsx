import type { VerdictStatus } from '@/lib/api'

interface VerdictBadgeProps {
  verdict: VerdictStatus
}

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const variants: Record<VerdictStatus, { bg: string; border: string; text: string; dot: string }> = {
    accepted: {
      bg: 'bg-green-900/30',
      border: 'border-green-700',
      text: 'text-green-300',
      dot: 'bg-green-400',
    },
    wrong_answer: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-300',
      dot: 'bg-red-400',
    },
    time_limit_exceeded: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    memory_limit_exceeded: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    runtime_error: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-300',
      dot: 'bg-red-400',
    },
    compile_error: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-300',
      dot: 'bg-red-400',
    },
    output_limit_exceeded: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    presentation_error: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-300',
      dot: 'bg-red-400',
    },
    // Distinct from runtime_error: the sandbox stopped it, the program did not
    // fail on its own. Worth its own treatment so it is visibly not a bug in
    // the user's logic.
    sandbox_violation: {
      bg: 'bg-fuchsia-900/30',
      border: 'border-fuchsia-700',
      text: 'text-fuchsia-300',
      dot: 'bg-fuchsia-400',
    },
    internal_error: {
      bg: 'bg-orange-900/30',
      border: 'border-orange-700',
      text: 'text-orange-300',
      dot: 'bg-orange-400',
    },
    cancelled: {
      bg: 'bg-neutral-900/30',
      border: 'border-neutral-700',
      text: 'text-neutral-400',
      dot: 'bg-neutral-500',
    },
    pending: {
      bg: 'bg-neutral-900/30',
      border: 'border-neutral-700',
      text: 'text-neutral-300',
      dot: 'bg-neutral-400',
    },
    queued: {
      bg: 'bg-neutral-900/30',
      border: 'border-neutral-700',
      text: 'text-neutral-300',
      dot: 'bg-neutral-400 animate-pulse',
    },
    compiling: {
      bg: 'bg-blue-900/30',
      border: 'border-blue-700',
      text: 'text-blue-300',
      dot: 'bg-blue-400 animate-pulse',
    },
    running: {
      bg: 'bg-blue-900/30',
      border: 'border-blue-700',
      text: 'text-blue-300',
      dot: 'bg-blue-400 animate-pulse',
    },
  }

  // Fall back rather than crash: an unrecognised verdict from a newer backend
  // should render plainly, not throw on `variant.bg`.
  const variant = variants[verdict] ?? variants.pending
  const label = verdict
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${variant.bg} ${variant.border}`}>
      <div className={`w-2 h-2 rounded-full ${variant.dot}`}></div>
      <span className={`text-xs font-semibold ${variant.text}`}>{label}</span>
    </div>
  )
}
