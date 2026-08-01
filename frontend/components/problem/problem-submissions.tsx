'use client'

import { useEffect, useState } from 'react'
import type { Submission } from '@/lib/api'
import { API } from '@/lib/api'
import { VerdictBadge } from '@/components/ui/verdict-badge'
import { SkeletonTable } from '@/components/ui/skeleton-loader'

interface ProblemSubmissionsProps {
  problemId: string
}

export function ProblemSubmissions({ problemId }: ProblemSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoading(true)
        const data = await API.getSubmissions(problemId)
        setSubmissions(data)
      } catch (error) {
        console.error('Failed to load submissions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSubmissions()
  }, [problemId])

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonTable rows={5} columns={5} />
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-neutral-400">
          <p className="text-sm">No submissions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-x-auto h-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-neutral-300">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-neutral-300">Status</th>
            <th className="text-left py-3 px-4 font-semibold text-neutral-300">Language</th>
            <th className="text-left py-3 px-4 font-semibold text-neutral-300">Time</th>
            <th className="text-right py-3 px-4 font-semibold text-neutral-300">Runtime</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => {
            const submittedDate = new Date(submission.createdAt)
            const timeAgo = getTimeAgo(submittedDate)

            return (
              <tr
                key={submission.id}
                className="border-b border-border hover:bg-surface-card transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 font-mono text-xs text-neutral-400">{submission.id}</td>
                <td className="py-3 px-4">
                  <VerdictBadge verdict={submission.verdict} />
                </td>
                <td className="py-3 px-4 text-neutral-300 capitalize">{submission.language}</td>
                <td className="py-3 px-4 text-neutral-400">{timeAgo}</td>
                <td className="py-3 px-4 text-right text-neutral-400">{submission.runtime}ms</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}
