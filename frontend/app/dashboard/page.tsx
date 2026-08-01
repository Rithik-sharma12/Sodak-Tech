'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Problem, User } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { DifficultyBadge } from '@/components/ui/difficulty-badge'
import { SkeletonCard, SkeletonLines } from '@/components/ui/skeleton-loader'
import { Flame, Target, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [userData, { problems: allProblems }] = await Promise.all([
          API.getCurrentUser(),
          API.getProblems({ limit: 5 }),
        ])
        setUser(userData)
        setProblems(allProblems)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-6">
          <SkeletonLines count={2} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto h-full">
        {/* Welcome section */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 text-balance">
            Welcome back, {user?.displayName || 'Coder'}!
          </h1>
          <p className="text-sm sm:text-base text-neutral-400">Keep coding and improve your skills</p>
        </div>

        {/* Stats - Responsive grid with auto-fit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-fit-cols">
          {/* Problems Solved */}
          <div className="bg-surface-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-neutral-400 text-xs sm:text-sm mb-1">Problems Solved</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{user?.problemsSolved || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-primary-500/20 rounded-lg flex-shrink-0">
                <Target className="text-primary-400" size={20} />
              </div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-surface-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-neutral-400 text-xs sm:text-sm mb-1">Current Streak</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{user?.currentStreak || 0} days</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Max: {user?.maxStreak || 0} days
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-accent-500/20 rounded-lg flex-shrink-0">
                <Flame className="text-accent-400" size={20} />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-surface-card border border-border rounded-lg p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-neutral-400 text-xs sm:text-sm mb-1">Rating</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{user?.rating || 0}</p>
              </div>
              <div className="p-2 sm:p-3 bg-primary-500/20 rounded-lg flex-shrink-0">
                <TrendingUp className="text-primary-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Problems */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Recent Problems</h2>
            <Link href="/problems" className="text-primary-400 hover:text-primary-300 text-sm">
              View all →
            </Link>
          </div>

          <div className="space-y-2">
            {problems.map((problem) => (
              <Link key={problem.id} href={`/problems/${problem.id}`}>
                <div className="bg-surface-card border border-border rounded-lg p-4 hover:border-primary-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary-400 transition-colors">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-1">
                        {problem.acceptanceRate.toFixed(1)}% acceptance rate
                      </p>
                    </div>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Contests */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Getting Started</h2>
          <div className="bg-surface-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">Ready to practice?</h3>
            <p className="text-neutral-400 text-sm mb-4">
              Start solving problems to improve your coding skills and climb the leaderboard.
            </p>
            <Link
              href="/problems"
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors"
            >
              Explore Problems
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
