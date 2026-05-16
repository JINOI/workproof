'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, LayoutDashboard, FileText, Users, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/dashboard' },
  { icon: FileText, label: 'SOP 관리', href: '/dashboard' },
  { icon: Users, label: '근로자', href: '/dashboard' },
  { icon: Settings, label: '설정', href: '/dashboard' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-[#3182f6]" />
          <span className="text-lg font-bold text-foreground">WorkProof</span>
        </Link>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#e8f3ff] text-[#3182f6]'
                      : 'text-[#6b7684] hover:bg-[#f2f4f6] hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#6b7684] hover:bg-[#f2f4f6] hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </Link>
      </div>
    </aside>
  )
}
