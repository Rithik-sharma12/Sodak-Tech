'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { memo, useCallback, useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  User as UserIcon,
  Zap,
} from 'lucide-react'
import { API, type User } from '@/lib/api'
import { apiClient } from '@/lib/api/client'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Problems', href: '/problems', icon: Code2 },
  { label: 'Contests', href: '/contests', icon: Trophy },
  { label: 'Leaderboard', href: '/leaderboard', icon: Zap },
  { label: 'Profile', href: '/profile', icon: UserIcon },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Persist the collapsed state. Re-collapsing the sidebar on every navigation
  // is the kind of small forgetfulness that makes an app feel unfinished.
  useEffect(() => {
    setIsCollapsed(localStorage.getItem('sodak.sidebar.collapsed') === 'true')
  }, [])

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => {
      localStorage.setItem('sodak.sidebar.collapsed', String(!prev))
      return !prev
    })
  }, [])

  useEffect(() => {
    API.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiClient.logout()
    } finally {
      router.push('/login')
    }
  }, [router])

  return (
    <aside
      className={`${isCollapsed ? 'w-[68px]' : 'w-60'} h-screen shrink-0 bg-surface-card
        border-r border-border flex flex-col transition-[width] duration-200 ease-out
        fixed left-0 top-0 z-40 md:relative`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
        <div
          className="w-8 h-8 shrink-0 rounded-lg bg-primary-200 grid place-items-center
            text-primary-900 font-bold text-sm"
          aria-hidden
        >
          S
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-display font-semibold text-[15px] leading-tight truncate">
              Sodak-Tech
            </div>
            <div className="text-[11px] text-neutral-500 leading-tight truncate">
              Practice. Compete.
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            // Exact match, or a true path-segment prefix. A bare startsWith
            // would light up "Problems" while on "/problems-archive".
            const isActive = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  title={isCollapsed ? label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-center gap-3 h-9 px-2.5 rounded-md
                    text-sm font-medium transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-surface-raised text-foreground'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-surface-raised/60'
                    }`}
                >
                  {/* Active marker. A rail beside the item rather than a filled
                      pill — it survives collapse and keeps the label legible. */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r-full
                      bg-primary-300 transition-all duration-150
                      ${isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'}`}
                    aria-hidden
                  />
                  <Icon
                    size={18}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-primary-300' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Account */}
      <div className="border-t border-border p-2">
        {user ? (
          <div
            className={`flex items-center gap-2.5 rounded-md px-2 py-2 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div
              className="w-7 h-7 shrink-0 rounded-full bg-primary-700 grid place-items-center
                text-[11px] font-semibold text-primary-100"
              aria-hidden
            >
              {(user.displayName || user.username).slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate leading-tight">
                    {user.displayName || user.username}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate leading-tight tnum">
                    {user.rating} rating
                  </div>
                </div>
                <button
                  onClick={signOut}
                  title="Sign out"
                  aria-label="Sign out"
                  className="p-1.5 rounded text-neutral-500 hover:text-danger
                    hover:bg-surface-raised transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        ) : (
          !isCollapsed && (
            <Link
              href="/login"
              className="btn btn-secondary w-full text-[13px] h-9"
            >
              Sign in
            </Link>
          )
        )}

        <button
          onClick={toggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mt-1 w-full flex items-center justify-center h-8 rounded-md
            text-neutral-500 hover:text-neutral-200 hover:bg-surface-raised transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

export const Sidebar = memo(SidebarContent)
