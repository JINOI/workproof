'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { SOPList } from '@/components/dashboard/sop-list'
import { NewSOPModal } from '@/components/dashboard/new-sop-modal'
import { mockSOPs, dashboardStats } from '@/lib/mock-data'

export default function DashboardPage() {
  const [searchValue, setSearchValue] = useState('')
  const [showNewSOPModal, setShowNewSOPModal] = useState(false)

  const filteredSOPs = mockSOPs.filter(sop => 
    sop.title.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#333d4b] mb-1">관리자 대시보드</h1>
            <p className="text-[#6b7684]">전체 현황 및 근로자 이수 현황을 확인하세요</p>
          </div>

          <StatsCards {...dashboardStats} />
          
          <SOPList 
            sops={filteredSOPs} 
            onNewSOP={() => setShowNewSOPModal(true)}
          />
        </main>
      </div>

      <NewSOPModal 
        open={showNewSOPModal} 
        onOpenChange={setShowNewSOPModal}
      />
    </div>
  )
}
