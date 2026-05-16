'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, LayoutDashboard, FileText, Users, Settings, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const sidebarItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/dashboard', activePath: '/dashboard' },
  { icon: FileText, label: 'SOP 관리', href: '/sop', activePrefix: '/sop' },
  { icon: Users, label: '근로자', href: '/dashboard' },
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
            const isActive = item.activePath === pathname || Boolean(item.activePrefix && pathname.startsWith(item.activePrefix))
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
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#6b7684] transition-colors hover:bg-[#f2f4f6] hover:text-foreground data-[state=open]:bg-[#f2f4f6] data-[state=open]:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  설정
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-40">
                <DropdownMenuItem>
                  <User className="h-4 w-4" />
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
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
