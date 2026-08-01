'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API } from '@/lib/api'
import { apiClient } from '@/lib/api/client'

/**
 * Login.
 *
 * Session-cookie auth: there is no token to store. The browser holds an
 * HTTP-only cookie the SPA cannot read, which is the point — §5.1 keeps
 * credentials out of anything an injected script could reach, and this
 * platform renders untrusted user code elsewhere in the app.
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('demo@sodak.test')
  const [password, setPassword] = useState('sodak-demo-2026')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If a session already exists, skip the form.
  useEffect(() => {
    API.getCurrentUser()
      .then(() => router.replace('/dashboard'))
      .catch(() => {
        /* not signed in; stay here */
      })
  }, [router])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setError(null)
      setIsSubmitting(true)
      try {
        await apiClient.login(email, password)
        router.push('/dashboard')
      } catch (err) {
        // The server returns one message for unknown-email and wrong-password
        // alike, so the form cannot be used to enumerate accounts.
        setError(err instanceof Error ? err.message : 'Sign in failed.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, password, router],
  )

  return (
    <div className="min-h-screen flex bg-[#0B1326] text-neutral-100">
      {/* Marketing panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 border-r border-[#222A3D]">
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          Master Coding.
          <br />
          Track Progress.
          <br />
          <span className="text-[#ADC6FF]">Get Placement Ready.</span>
        </h1>
        <p className="mt-6 text-neutral-400 max-w-md">
          Solve algorithmic problems against real test cases, get scored feedback per
          test group, and compete in timed contests.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          {['Real-time IDE', 'Placement Analytics', 'Global Leaderboards'].map((f) => (
            <span
              key={f}
              className="px-4 py-2 rounded-lg bg-[#171F33] border border-[#222A3D] text-sm text-neutral-300"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#171F33] border border-[#222A3D] rounded-2xl p-8">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Sign in to continue your learning journey.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] text-neutral-100 outline-none focus:border-[#4D8EFF] focus:ring-2 focus:ring-[#4D8EFF]/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-neutral-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-20 rounded-lg bg-[#0B1326] border border-[#222A3D] text-neutral-100 outline-none focus:border-[#4D8EFF] focus:ring-2 focus:ring-[#4D8EFF]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-[#ADC6FF] text-[#0B1326] font-semibold hover:bg-[#D8E2FF] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-xs text-neutral-500 text-center">
              Demo account is pre-filled. Seed it with{' '}
              <code className="text-neutral-400">manage.py seed_demo</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
