'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function DashboardPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="dashboard-page-transition flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  )
}
