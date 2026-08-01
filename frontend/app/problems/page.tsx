'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Problem } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { DifficultyBadge } from '@/components/ui/difficulty-badge'
import { SkeletonTable } from '@/components/ui/skeleton-loader'
import { Search } from 'lucide-react'

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')

  useEffect(() => {
    const loadProblems = async () => {
      try {
        setIsLoading(true)
        const { problems } = await API.getProblems({
          difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
          search: searchQuery || undefined,
        })
        setProblems(problems)
      } catch (error) {
        console.error('Failed to load problems:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadProblems, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, difficultyFilter])

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-surface-base">
        {/* Header */}
        <div className="border-b border-border bg-surface-card p-6">
          <h1 className="text-3xl font-bold text-foreground mb-6">Problems</h1>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-base border border-border rounded-md pl-10 pr-4 py-2 text-foreground placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div>
                <label className="text-sm text-neutral-400 block mb-2">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="px-4 py-2 bg-surface-base border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Problems list */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6">
              <SkeletonTable rows={10} columns={5} />
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-neutral-400">
                <p className="text-sm">No problems found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-card border-b border-border sticky top-0">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Title</th>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Difficulty</th>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Acceptance</th>
                    <th className="text-left py-4 px-6 font-semibold text-neutral-300 text-sm">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem) => (
                    <tr
                      key={problem.id}
                      className="border-b border-border hover:bg-surface-card/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-neutral-400 text-sm font-mono">{problem.id}</td>
                      <td className="py-4 px-6">
                        <Link
                          href={`/problems/${problem.id}`}
                          className="text-primary-400 hover:text-primary-300 font-medium group-hover:underline"
                        >
                          {problem.title}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <DifficultyBadge difficulty={problem.difficulty} />
                      </td>
                      <td className="py-4 px-6 text-neutral-400 text-sm">
                        {problem.acceptanceRate.toFixed(1)}%
                      </td>
                      <td className="py-4 px-6 text-neutral-400 text-sm">{problem.totalSubmissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
