'use client'

import { memo, useCallback, useState } from 'react'
import { Bell, Search, User, Settings } from 'lucide-react'

function AdminTopBarContent() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleNotificationClick = useCallback(() => {
    setShowNotifications(prev => !prev)
    setShowProfile(false)
  }, [])

  const handleProfileClick = useCallback(() => {
    setShowProfile(prev => !prev)
    setShowNotifications(false)
  }, [])

  return (
    <div className="h-16 bg-surface-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-surface-base border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className="relative p-2 text-neutral-400 hover:text-foreground hover:bg-surface-raised rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-400 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-card border border-border rounded-lg shadow-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2 bg-surface-raised rounded text-sm text-neutral-300">
                  System maintenance completed
                </div>
                <div className="p-2 bg-surface-raised rounded text-sm text-neutral-300">
                  New user report pending review
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={handleProfileClick}
            className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold hover:bg-primary-600 transition-colors"
            aria-label="Profile"
          >
            A
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-foreground">John Admin</p>
                <p className="text-xs text-neutral-400">admin@sodak-tech.com</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-surface-raised transition-colors">
                  <Settings size={16} />
                  Settings
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-surface-raised transition-colors text-danger">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const AdminTopBar = memo(AdminTopBarContent)
