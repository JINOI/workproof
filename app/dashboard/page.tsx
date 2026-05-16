'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { DashboardHeader } from '@/components/dashboard/header'
import { NewSOPModal } from '@/components/dashboard/new-sop-modal'
import { Sidebar } from '@/components/dashboard/sidebar'
import { type DashboardSop, SOPList } from '@/components/dashboard/sop-list'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { createClient } from '@/lib/supabase/client'

type ApiSop = {
  id: string
  title: string
  description: string | null
  created_at: string
  status: 'draft' | 'active' | 'archived'
  totalWorkers: number
  completedWorkers: number
  completionRate: number
}

const emptyStats = {
  activeSOPs: 0,
  totalWorkers: 0,
  completionRate: 0,
  pendingWorkers: 0,
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function toDashboardSop(sop: ApiSop): DashboardSop {
  return {
    id: sop.id,
    title: sop.title,
    description: sop.description,
    createdAt: formatDate(sop.created_at),
    totalWorkers: sop.totalWorkers,
    completedWorkers: sop.completedWorkers,
    completionRate: sop.completionRate,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoadingSops, setIsLoadingSops] = useState(false)
  const [sops, setSops] = useState<DashboardSop[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [showNewSOPModal, setShowNewSOPModal] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!isMounted) {
        return
      }

      if (!user) {
        router.replace('/')
        return
      }

      setIsCheckingSession(false)
      setIsLoadingSops(true)

      try {
        const response = await fetch('/api/sops', {
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (!response.ok) {
          throw new Error('SOP 목록을 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as { sops: ApiSop[] }

        if (isMounted) {
          setSops(payload.sops.map(toDashboardSop))
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'SOP 목록을 불러오지 못했습니다.')
          setSops([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingSops(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [router, refreshToken])

  const filteredSOPs = useMemo(
    () => sops.filter((sop) => sop.title.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue, sops],
  )

  const stats = useMemo(() => {
    if (sops.length === 0) {
      return emptyStats
    }

    const totalWorkers = sops.reduce((sum, sop) => sum + sop.totalWorkers, 0)
    const completedWorkers = sops.reduce((sum, sop) => sum + sop.completedWorkers, 0)

    return {
      activeSOPs: sops.length,
      totalWorkers,
      completionRate: totalWorkers === 0 ? 0 : Math.round((completedWorkers / totalWorkers) * 100),
      pendingWorkers: Math.max(totalWorkers - completedWorkers, 0),
    }
  }, [sops])

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-[#6b7684]">
        로그인 상태를 확인하는 중입니다...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <DashboardHeader searchValue={searchValue} onSearchChange={setSearchValue} />

        <main className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-[#333d4b]">관리자 대시보드</h1>
            <p className="text-[#6b7684]">현재 계정에 등록된 SOP와 작업자 이수 현황만 표시합니다.</p>
          </div>

          {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

          <StatsCards {...stats} />

          <SOPList sops={filteredSOPs} isLoading={isLoadingSops} onNewSOP={() => setShowNewSOPModal(true)} />
        </main>
      </div>

      <NewSOPModal open={showNewSOPModal} onOpenChange={setShowNewSOPModal} onCreated={() => setRefreshToken((value) => value + 1)} />
    </div>
  )
}
