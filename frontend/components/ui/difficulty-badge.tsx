import type { Difficulty } from '@/lib/api'

interface DifficultyBadgeProps {
  difficulty: Difficulty
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const variants = {
    easy: {
      bg: 'bg-green-900/30',
      border: 'border-green-700',
      text: 'text-green-300',
      dot: 'bg-green-400',
    },
    medium: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
    },
    hard: {
      bg: 'bg-red-900/30',
      border: 'border-red-700',
      text: 'text-red-300',
      dot: 'bg-red-400',
    },
  }

  const variant = variants[difficulty]

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${variant.bg} ${variant.border}`}>
      <div className={`w-2 h-2 rounded-full ${variant.dot}`}></div>
      <span className={`text-xs font-semibold capitalize ${variant.text}`}>{difficulty}</span>
    </div>
  )
}
