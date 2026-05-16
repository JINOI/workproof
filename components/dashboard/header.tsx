'use client'

import type { ReactNode } from 'react'
import { PanelLeft, Search } from 'lucide-react'

import { useDashboardSidebar } from '@/components/dashboard/sidebar-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  placeholder?: string
  headerActions?: ReactNode
}

export function DashboardHeader({
  searchValue = '',
  onSearchChange,
  placeholder = '안전 관리 가이드 제목 또는 작업자를 검색하세요',
  headerActions,
}: DashboardHeaderProps) {
  const { isOpen, toggleSidebar } = useDashboardSidebar()

  return (
    <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-expanded={isOpen}
        aria-label={isOpen ? '메뉴 숨기기' : '메뉴 보이기'}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <PanelLeft className={cn('h-5 w-5 transition-transform', !isOpen && 'scale-x-[-1]')} />
      </Button>

      <div className="relative min-w-0 flex-1 sm:max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a1]" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="h-10 border-0 bg-[#f2f4f6] pl-10 focus:bg-white focus:ring-1 focus:ring-primary"
        />
      </div>
      {headerActions && <div className="flex w-full justify-end sm:ml-auto sm:w-auto">{headerActions}</div>}
    </header>
  )
}
