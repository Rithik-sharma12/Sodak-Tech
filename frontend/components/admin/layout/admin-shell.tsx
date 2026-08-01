'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  Code2,
  LayoutDashboard,
  ShieldAlert,
  Trophy,
  Users,
} from 'lucide-react'
import { API, type User } from '@/lib/api'

const NAV = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Problems', href: '/admin/problems', icon: Code2 },
  { label: 'Contests', href: '/admin/contests', icon: Trophy },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Audit log', href: '/admin/audit', icon: ClipboardList },
  { label: 'System health', href: '/admin/system-health', icon: Activity },
] as const

/**
 * Admin shell with a client-side role gate.
 *
 * The gate is a convenience, not a security boundary — every admin endpoint
 * re-checks the caller's role server-side. §3.4: "Hiding a control in the UI is
 * not access control." Removing this component would change what is visible,
 * not what is permitted.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    API.getCurrentUser()
      .then((u) => {
        setUser(u)
        const privileged = ['problem_setter', 'contest_manager', 'admin', 'super_admin']
        setState(privileged.includes(String(u.role)) ? 'allowed' : 'denied')
      })
      .catch(() => setState('denied'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-base">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-primary-400" />
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-base px-6">
        <div className="panel max-w-md p-8 text-center">
          <ShieldAlert size={28} className="mx-auto text-danger" />
          <h1 className="mt-4 font-display text-lg font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Your account doesn&apos;t have permission to view this area.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn btn-primary mt-6">
            Back to the platform
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface-base">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface-card md:relative">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-400 text-sm font-bold text-white">
            S
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold leading-tight">
              Administration
            </div>
            <div className="truncate text-[11px] leading-tight text-neutral-500">
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {NAV.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm
                      font-medium transition-colors ${
                        isActive
                          ? 'bg-surface-raised text-foreground'
                          : 'text-neutral-400 hover:bg-surface-raised/60 hover:text-neutral-100'
                      }`}
                  >
                    <span
                      className={`absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-full
                        bg-accent-400 transition-all ${isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'}`}
                      aria-hidden
                    />
                    <Icon
                      size={17}
                      className={isActive ? 'text-accent-400' : 'text-neutral-500'}
                    />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-2">
          <Link
            href="/dashboard"
            className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px]
              text-neutral-400 transition-colors hover:bg-surface-raised hover:text-neutral-100"
          >
            <ArrowLeft size={15} />
            Exit admin
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}

/** Consistent page header. Title, description, and optional actions. */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Empty state. A fresh install shows these constantly, so they matter. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon size={26} className="text-neutral-600" />
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
