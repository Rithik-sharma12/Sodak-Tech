'use client'

import { memo } from 'react'
import { AdminSidebar } from '../sidebar'
import { AdminTopBar } from '../top-bar'

interface AdminLayoutProps {
  children: React.ReactNode
}

function AdminLayoutComponent({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <AdminTopBar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export const AdminLayout = memo(AdminLayoutComponent)
