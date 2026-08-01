'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Search, Settings, User as UserIcon } from 'lucide-react'
import { API, type User } from '@/lib/api'
import { apiClient } from '@/lib/api/client'

function TopBarContent() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [openMenu, setOpenMenu] = useState<'user' | 'notifications' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    API.getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  // Dismiss on outside click and on Escape. A dropdown that only closes by
  // clicking the trigger again is the most common way this component is left
  // half-finished.
  useEffect(() => {
    if (!openMenu) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openMenu])

  // Cmd/Ctrl-K to focus search. Cheap to add, and its absence is immediately
  // noticeable to the audience this product has.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const onSearch = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      router.push(query.trim() ? `/problems?search=${encodeURIComponent(query.trim())}` : '/problems')
    },
    [query, router],
  )

  const signOut = useCallback(async () => {
    try {
      await apiClient.logout()
    } finally {
      router.push('/login')
    }
  }, [router])

  return (
    <header
      ref={containerRef}
      className="h-16 shrink-0 bg-surface-card/80 backdrop-blur-xl border-b border-border
        flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-30"
    >
      <form onSubmit={onSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            size={16}
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems…"
            aria-label="Search problems"
            className="input pl-9 pr-12 h-9"
          />
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block
              px-1.5 py-0.5 rounded border border-border text-[10px] text-neutral-500
              pointer-events-none font-mono"
          >
            ⌘K
          </kbd>
        </div>
      </form>

      <div className="flex items-center gap-1 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu((m) => (m === 'notifications' ? null : 'notifications'))}
            aria-label="Notifications"
            aria-expanded={openMenu === 'notifications'}
            className="relative p-2 rounded-md text-neutral-400 hover:text-neutral-100
              hover:bg-surface-raised transition-colors"
          >
            <Bell size={18} />
          </button>

          {openMenu === 'notifications' && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-80 panel p-4 shadow-lg"
            >
              <h3 className="font-display font-semibold text-sm">Notifications</h3>
              {/* Honest empty state. There is no notification model on the
                  backend yet, so inventing rows here would be a lie the UI
                  tells about itself. */}
              <p className="mt-3 text-[13px] text-neutral-500 leading-relaxed">
                Nothing yet. Verdicts and contest announcements will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu((m) => (m === 'user' ? null : 'user'))}
            aria-label="Account menu"
            aria-expanded={openMenu === 'user'}
            className="flex items-center gap-2 p-1 pr-2 rounded-md hover:bg-surface-raised
              transition-colors"
          >
            <span
              className="w-7 h-7 rounded-full bg-primary-700 grid place-items-center
                text-[11px] font-semibold text-primary-100"
              aria-hidden
            >
              {user ? (user.displayName || user.username).slice(0, 2).toUpperCase() : '—'}
            </span>
            <span className="hidden sm:block text-[13px] font-medium max-w-[10ch] truncate">
              {user?.displayName || user?.username || 'Guest'}
            </span>
          </button>

          {openMenu === 'user' && (
            <div role="menu" className="absolute right-0 top-full mt-2 w-56 panel p-1.5 shadow-lg">
              {user ? (
                <>
                  <div className="px-2.5 py-2 border-b border-border mb-1">
                    <div className="text-[13px] font-medium truncate">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">{user.email}</div>
                  </div>
                  <MenuLink href="/profile" icon={<UserIcon size={15} />} label="Profile" />
                  <MenuLink href="/settings" icon={<Settings size={15} />} label="Settings" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]
                      text-neutral-300 hover:text-danger hover:bg-surface-raised transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </>
              ) : (
                <MenuLink href="/login" icon={<UserIcon size={15} />} label="Sign in" />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-neutral-300
        hover:text-foreground hover:bg-surface-raised transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

export const TopBar = memo(TopBarContent)
