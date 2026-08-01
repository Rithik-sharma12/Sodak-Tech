'use client'

import { useEffect, useState } from 'react'
import type { LeaderboardEntry } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { SkeletonTable } from '@/components/ui/skeleton-loader'
import { Trophy } from 'lucide-react'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true)
        const data = await API.getLeaderboard(50, 0)
        setLeaderboard(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 bg-yellow-900/20'
    if (rank === 2) return 'text-gray-300 bg-gray-900/20'
    if (rank === 3) return 'text-orange-600 bg-orange-900/20'
    return 'text-neutral-400'
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-neutral-400">Top performers in the community</p>
        </div>

        {/* Leaderboard table */}
        <div className="flex-1 bg-surface-card border border-border rounded-lg overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable rows={10} columns={5} />
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-surface-raised border-b border-border sticky top-0">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Rank</th>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Username</th>
                    <th className="text-right py-4 px-6 font-semibold text-neutral-300 text-sm">Score</th>
                    <th className="text-right py-4 px-6 font-semibold text-neutral-300 text-sm">
                      Problems Solved
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-neutral-300 text-sm">
                      Last Submission
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaderboard.map((entry) => {
                    const lastSubmission = new Date(entry.lastSubmissionTime)
                    const timeAgo = getTimeAgo(lastSubmission)

                    return (
                      <tr
                        key={entry.userId}
                        className="hover:bg-surface-raised/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getMedalColor(entry.rank)}`}>
                            {entry.rank === 1 && <Trophy size={16} />}
                            {entry.rank === 2 && <Trophy size={16} />}
                            {entry.rank === 3 && <Trophy size={16} />}
                            {entry.rank > 3 && entry.rank}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-foreground">{entry.username}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-primary-400 font-semibold">{entry.score}</span>
                        </td>
                        <td className="py-4 px-6 text-right text-neutral-300">
                          {entry.problemsSolved}
                        </td>
                        <td className="py-4 px-6 text-right text-neutral-500 text-sm">
                          {timeAgo}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
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
