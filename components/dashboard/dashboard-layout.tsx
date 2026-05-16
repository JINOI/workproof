'use client'

import type { ReactNode } from 'react'

import { DashboardPageTransition } from '@/components/dashboard/dashboard-page-transition'
import { DashboardHeader } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { SidebarProvider } from '@/components/dashboard/sidebar-context'

interface DashboardLayoutProps {
  children: ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  placeholder?: string
  headerActions?: ReactNode
  footer?: ReactNode
}

export function DashboardLayout({
  children,
  searchValue,
  onSearchChange,
  placeholder,
  headerActions,
  footer,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            placeholder={placeholder}
            headerActions={headerActions}
          />

          <DashboardPageTransition>{children}</DashboardPageTransition>
        </div>

        {footer}
      </div>
    </SidebarProvider>
  )
}
