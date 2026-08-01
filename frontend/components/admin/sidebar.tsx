'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo, useMemo } from 'react'
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Tag,
  Bell,
  BarChart3,
  Activity,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

function AdminSidebarContent() {
  const pathname = usePathname()

  const navItems: NavItem[] = useMemo(
    () => [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
      { label: 'Problems', href: '/admin/problems', icon: <FileText size={20} /> },
      { label: 'Contests', href: '/admin/contests', icon: <Trophy size={20} /> },
      { label: 'Categories', href: '/admin/categories', icon: <Tag size={20} /> },
      { label: 'Notifications', href: '/admin/notifications', icon: <Bell size={20} /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
      { label: 'System Health', href: '/admin/system-health', icon: <Activity size={20} /> },
      { label: 'Moderation', href: '/admin/moderation', icon: <Shield size={20} /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
    ],
    []
  )

  return (
    <div className="w-64 bg-surface-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sodak</h1>
            <p className="text-xs text-neutral-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-400 hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-400 hover:text-foreground hover:bg-surface-raised transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

export const AdminSidebar = memo(AdminSidebarContent)
