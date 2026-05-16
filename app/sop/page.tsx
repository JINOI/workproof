'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { CompanyQrDialogButton } from '@/components/dashboard/company-qr'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { NewSOPModal } from '@/components/dashboard/new-sop-modal'
import { type DashboardSop, SOPList } from '@/components/dashboard/sop-list'
import { createClient } from '@/lib/supabase/client'

type ApiSop = {
  id: string
  title: string
  description: string | null
  created_at: string
  totalWorkers: number
  completedWorkers: number
  completionRate: number
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

export default function SOPManagementPage() {
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

    async function loadSops() {
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
          throw new Error('안전 관리 가이드 목록을 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as { sops: ApiSop[] }

        if (isMounted) {
          setSops(payload.sops.map(toDashboardSop))
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '안전 관리 가이드 목록을 불러오지 못했습니다.')
          setSops([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingSops(false)
        }
      }
    }

    loadSops()

    return () => {
      isMounted = false
    }
  }, [router, refreshToken])

  const filteredSOPs = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase()
    if (!normalizedSearchValue) {
      return sops
    }

    return sops.filter((sop) => {
      const description = sop.description ?? ''
      return sop.title.toLowerCase().includes(normalizedSearchValue) || description.toLowerCase().includes(normalizedSearchValue)
    })
  }, [searchValue, sops])

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-[#6b7684]">
        로그인 상태를 확인하는 중입니다...
      </div>
    )
  }

  return (
    <DashboardLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      placeholder="안전 관리 가이드 제목 또는 설명으로 검색..."
      headerActions={<CompanyQrDialogButton />}
    >
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-[#333d4b]">안전 관리 가이드 관리</h1>
          <p className="text-[#6b7684]">등록한 안전 관리 가이드 목록을 확인하고 필요한 문서를 검색하세요.</p>
        </div>

        {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

        <SOPList
          sops={filteredSOPs}
          isLoading={isLoadingSops}
          onNewSOP={() => setShowNewSOPModal(true)}
          onSOPDeleted={(sopId) => {
            setSops((currentSops) => currentSops.filter((sop) => sop.id !== sopId))
            setLoadError(null)
          }}
          onDeleteError={setLoadError}
        />
      </main>

      <NewSOPModal open={showNewSOPModal} onOpenChange={setShowNewSOPModal} onCreated={() => setRefreshToken((value) => value + 1)} />
    </DashboardLayout>
  )
}
