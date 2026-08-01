'use client'

import { useEffect, useState } from 'react'
import type { User, Submission } from '@/lib/api'
import { API } from '@/lib/api'
import { AppLayout } from '@/components/layout/app-layout'
import { VerdictBadge } from '@/components/ui/verdict-badge'
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton-loader'
import { Award, Code, Flame, Target } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const [userData, submissionData] = await Promise.all([
          API.getCurrentUser(),
          API.getSubmissions(),
        ])
        setUser(userData)
        setSubmissions(submissionData.slice(0, 10))
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-6">
          <SkeletonCard count={1} />
          <SkeletonTable rows={10} columns={5} />
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-neutral-400">User not found</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6 overflow-y-auto h-full">
        {/* Profile header */}
        <div className="bg-surface-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-2xl font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{user.displayName}</h1>
                  <p className="text-neutral-400">@{user.username}</p>
                  {user.bio && <p className="text-neutral-300 text-sm mt-2">{user.bio}</p>}
                </div>
              </div>
            </div>
            <button className="px-6 py-2 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="text-primary-400" size={20} />
              <p className="text-neutral-400 text-sm">Problems Solved</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{user.problemsSolved}</p>
          </div>

          <div className="bg-surface-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Code className="text-accent-400" size={20} />
              <p className="text-neutral-400 text-sm">Total Submissions</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{user.totalSubmissions}</p>
          </div>

          <div className="bg-surface-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="text-orange-400" size={20} />
              <p className="text-neutral-400 text-sm">Current Streak</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{user.currentStreak} days</p>
          </div>

          <div className="bg-surface-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Award className="text-yellow-400" size={20} />
              <p className="text-neutral-400 text-sm">Rating</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{user.rating}</p>
          </div>
        </div>

        {/* Additional info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Streak Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current Streak</span>
                <span className="text-foreground font-semibold">{user.currentStreak} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Longest Streak</span>
                <span className="text-foreground font-semibold">{user.maxStreak} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Member Since</span>
                <span className="text-foreground font-semibold">
                  {new Date(user.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Rating</span>
                <span className="text-primary-400 font-semibold">{user.rating}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Acceptance Rate</span>
                <span className="text-foreground font-semibold">
                  {user.totalSubmissions > 0
                    ? ((user.problemsSolved / user.totalSubmissions) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-surface-base rounded-full h-2 mt-4">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{
                    width: `${
                      user.totalSubmissions > 0
                        ? (user.problemsSolved / user.totalSubmissions) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent submissions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Submissions</h2>
          <div className="bg-surface-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-raised border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300 text-sm">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300 text-sm">Problem</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300 text-sm">Language</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-300 text-sm">Time</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-border hover:bg-surface-raised/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-neutral-500 font-mono">{submission.id}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{submission.problemId}</td>
                    <td className="py-3 px-4 text-sm">
                      <VerdictBadge verdict={submission.verdict} />
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-400 capitalize">{submission.language}</td>
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
