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
  placeholder = 'SOP 제목 또는 키워드로 검색...'
}: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b95a1]" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 h-10 bg-[#f2f4f6] border-0 focus:bg-white focus:ring-1 focus:ring-[#3182f6]"
        />
      </div>
    </header>
  )
}
