'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, LayoutDashboard, LogOut, Settings, Shield, User, Users } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { icon: LayoutDashboard, label: '대시보드', href: '/dashboard', activePath: '/dashboard' },
  { icon: FileText, label: 'SOP 관리', href: '/sop', activePrefix: '/sop' },
  { icon: Users, label: '근로자', href: '/workers', activePrefix: '/workers' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-border bg-card">
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
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-[#e8f3ff] text-[#3182f6]' : 'text-[#6b7684] hover:bg-[#f2f4f6] hover:text-foreground',
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
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#6b7684] transition-colors hover:bg-[#f2f4f6] hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
