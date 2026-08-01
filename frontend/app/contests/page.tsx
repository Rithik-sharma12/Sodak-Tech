'use client'

import { useEffect, useState } from 'react'
import type { Contest } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { SkeletonCard } from '@/components/ui/skeleton-loader'
import { Calendar, Users } from 'lucide-react'

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContests = async () => {
      try {
        setIsLoading(true)
        const data = await API.getContests()
        setContests(data)
      } catch (error) {
        console.error('Failed to load contests:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContests()
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} count={1} />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6 h-full overflow-y-auto">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Contests</h1>
          <p className="text-neutral-400">Participate in contests and compete with other programmers</p>
        </div>

        <div className="space-y-4">
          {contests.map((contest) => {
            const startDate = new Date(contest.startTime)
            const endDate = new Date(contest.endTime)
            const now = new Date()
            const isUpcoming = startDate > now
            const isOngoing = startDate <= now && now < endDate
            const isPast = endDate < now

            return (
              <div
                key={contest.id}
                className="bg-surface-card border border-border rounded-lg p-6 hover:border-primary-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{contest.name}</h2>
                    <p className="text-sm text-neutral-400 mt-1">{contest.description}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold">
                    {isUpcoming && (
                      <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full border border-blue-700">
                        Upcoming
                      </span>
                    )}
                    {isOngoing && (
                      <span className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full border border-green-700">
                        Ongoing
                      </span>
                    )}
                    {isPast && (
                      <span className="bg-neutral-900/30 text-neutral-400 px-3 py-1 rounded-full border border-neutral-700">
                        Past
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-500" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Start</p>
                      <p className="text-foreground font-medium">{formatDate(startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-500" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Duration</p>
                      <p className="text-foreground font-medium">{contest.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-neutral-500" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Problems</p>
                      <p className="text-foreground font-medium">{contest.problemCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-neutral-500" />
                    <div className="text-sm">
                      <p className="text-neutral-500">Participants</p>
                      <p className="text-foreground font-medium">{contest.participantCount}</p>
                    </div>
                  </div>
                </div>

                <button
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isOngoing
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-surface-raised text-neutral-300 hover:bg-surface-raised/80'
                  }`}
                >
                  {isOngoing ? 'Enter Contest' : 'View Details'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
