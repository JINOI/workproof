'use client'

import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

interface DashboardHeaderProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  placeholder?: string
}

export function DashboardHeader({
  searchValue = '',
  onSearchChange,
  placeholder = 'SOP 제목 또는 작업자를 검색하세요',
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-6">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a1]" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="h-10 border-0 bg-[#f2f4f6] pl-10 focus:bg-white focus:ring-1 focus:ring-[#3182f6]"
        />
      </div>
    </header>
  )
}
