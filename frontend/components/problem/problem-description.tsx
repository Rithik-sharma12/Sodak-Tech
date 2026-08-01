import type { Problem } from '@/lib/api'
import { DifficultyBadge } from '@/components/ui/difficulty-badge'

interface ProblemDescriptionProps {
  problem: Problem
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <span>{problem.acceptanceRate.toFixed(1)}% Acceptance</span>
          <span>{problem.totalSubmissions} Submissions</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Description</h2>
        <div className="text-neutral-300 whitespace-pre-wrap">{problem.description}</div>
      </div>

      {/* Examples */}
      {problem.examples.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Examples</h2>
          <div className="space-y-3">
            {problem.examples.map((example, idx) => (
              <div key={example.id} className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-300">Example {idx + 1}:</p>
                <div className="bg-surface-base rounded p-3">
                  <p className="text-xs text-neutral-500 mb-1">Input:</p>
                  <p className="font-mono text-sm text-primary-300 break-all">{example.input}</p>
                </div>
                <div className="bg-surface-base rounded p-3">
                  <p className="text-xs text-neutral-500 mb-1">Output:</p>
                  <p className="font-mono text-sm text-green-300 break-all">{example.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints */}
      {problem.constraints.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Constraints</h2>
          <ul className="list-disc list-inside space-y-1 text-neutral-300">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className="text-sm">
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {problem.tags.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-surface-raised border border-border text-sm text-neutral-300 hover:bg-surface-raised hover:border-primary-500 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
