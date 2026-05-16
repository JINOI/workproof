'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import { FileText, LayoutDashboard, LogOut, Settings, User, Users, type LucideIcon } from 'lucide-react'

import { SafeBridgeLogo } from '@/components/brand/safebridge-logo'
import { ProfileDialog } from '@/components/dashboard/profile-dialog'

import { useDashboardSidebar } from '@/components/dashboard/sidebar-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type SidebarItem = {
  icon: LucideIcon
  label: string
  href: string
  activePath?: string
  activePrefix?: string
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: '대시보드', href: '/dashboard', activePath: '/dashboard' },
  { icon: FileText, label: '안전 관리 가이드', href: '/sop', activePrefix: '/sop' },
  { icon: Users, label: '근로자', href: '/workers', activePrefix: '/workers' },
]

function isSidebarItemActive(item: SidebarItem, pathname: string) {
  if (item.activePath === pathname) {
    return true
  }

  return item.activePrefix ? pathname.startsWith(item.activePrefix) : false
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen } = useDashboardSidebar()
  const navListRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 })
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  useLayoutEffect(() => {
    const list = navListRef.current
    if (!list) {
      return
    }

    const activeLink = list.querySelector<HTMLElement>('[data-nav-active="true"]')
    if (!activeLink) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }))
      return
    }

    setIndicator({
      top: activeLink.offsetTop,
      height: activeLink.offsetHeight,
      opacity: 1,
    })
  }, [pathname, isOpen])

  return (
    <aside
      className={cn(
        'flex min-h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0',
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-64 flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="block">
            <SafeBridgeLogo variant="sidebar" />
          </Link>
        </div>

        <nav className="flex-1 px-4">
          <ul ref={navListRef} className="relative space-y-1">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 rounded-lg bg-accent transition-[top,height,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                top: indicator.top,
                height: indicator.height,
                opacity: indicator.opacity,
              }}
            />

            {sidebarItems.map((item) => {
              const isActive = isSidebarItemActive(item, pathname)

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    data-nav-active={isActive}
                    className={cn(
                      'relative z-10 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
                    className="relative z-10 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground data-[state=open]:bg-muted/60 data-[state=open]:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    설정
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-40">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      setProfileOpen(true)
                    }}
                  >
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
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </button>
        </div>
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  )
}
