'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SOPList } from '@/components/dashboard/sop-list'
import { NewSOPModal } from '@/components/dashboard/new-sop-modal'
import { mockSOPs } from '@/lib/mock-data'

export default function SOPManagementPage() {
  const [searchValue, setSearchValue] = useState('')
  const [showNewSOPModal, setShowNewSOPModal] = useState(false)

  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredSOPs = mockSOPs.filter((sop) => {
    if (!normalizedSearchValue) {
      return true
    }

    return (
      sop.title.toLowerCase().includes(normalizedSearchValue) ||
      sop.description.toLowerCase().includes(normalizedSearchValue)
    )
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          placeholder="SOP 제목 또는 설명으로 검색..."
        />

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#333d4b] mb-1">SOP 관리</h1>
            <p className="text-[#6b7684]">등록된 SOP 목록을 확인하고 필요한 문서를 검색하세요</p>
          </div>

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
