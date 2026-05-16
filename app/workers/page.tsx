'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { type WorkerDetail, WorkerDetailModal } from '@/components/dashboard/worker-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getClientAuthenticatedUser } from '@/lib/auth/client-session'
import { createClient } from '@/lib/supabase/client'
import {
  buildWorkerSopRows,
  buildWorkerRows,
  filterWorkerLogs,
  getSopFilterOptions,
  getWorkerFilterOptions,
  getWrongQuestionLabels,
  type WorkerLogRow,
  type WorkerSummaryRow,
  type WrongQuestionLabelSource,
} from '@/lib/workproof/workers'

type WorkerStatus = WorkerDetail['status']

type WorkerRow = WorkerSummaryRow

type ApiSopSummary = {
  id: string
}

type ApiEducationLog = {
  id: string
  worker_name: string
  worker_birth_date: string
  status: WorkerStatus
  attempts: number
  completed_at: string | null
  wrong_question_ids: string[]
}

type ApiQuizQuestion = WrongQuestionLabelSource

type ApiSopDetail = {
  id: string
  title: string
  quiz_questions: ApiQuizQuestion[]
  education_logs: ApiEducationLog[]
}

const ALL_WORKERS_VALUE = 'all-workers'
const ALL_SOPS_VALUE = 'all-sops'

const statusConfig = {
  safe: {
    label: '안전',
    icon: CheckCircle,
    badgeClassName: 'bg-[#e6f9f1] text-[#00d082] hover:bg-[#e6f9f1]',
    iconClassName: 'bg-[#e6f9f1] text-[#00d082]',
  },
  warning: {
    label: '주의',
    icon: AlertTriangle,
    badgeClassName: 'bg-[#fff4d6] text-[#b88600] hover:bg-[#fff4d6]',
    iconClassName: 'bg-[#fff4d6] text-[#b88600]',
  },
  failed: {
    label: '실패',
    icon: AlertTriangle,
    badgeClassName: 'bg-[#fff0f0] text-[#f04452] hover:bg-[#fff0f0]',
    iconClassName: 'bg-[#fff0f0] text-[#f04452]',
  },
  pending: {
    label: '대기',
    icon: Clock,
    badgeClassName: 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#f2f4f6]',
    iconClassName: 'bg-[#f2f4f6] text-[#6b7684]',
  },
}

function formatDateTime(value: string | null) {
  if (!value) return null

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function toWorkerLogRow(log: ApiEducationLog, sopId: string, sopTitle: string, quizQuestions: ApiQuizQuestion[]): WorkerLogRow {
  return {
    id: log.id,
    name: log.worker_name,
    birthDate: log.worker_birth_date,
    status: log.status,
    attempts: log.attempts,
    completedAt: formatDateTime(log.completed_at),
    completedAtSortValue: log.completed_at,
    wrongAnswers: getWrongQuestionLabels(log.wrong_question_ids, quizQuestions),
    sopId,
    sopTitle,
  }
}

function matchesWorkerSearch(worker: WorkerRow, searchValue: string) {
  const normalizedSearchValue = searchValue.trim().toLowerCase()

  if (!normalizedSearchValue) {
    return true
  }

  const statusLabel = statusConfig[worker.status].label

  return (
    worker.name.toLowerCase().includes(normalizedSearchValue) ||
    worker.birthDate.includes(normalizedSearchValue) ||
    worker.sopTitle.toLowerCase().includes(normalizedSearchValue) ||
    worker.sopTitles.some((sopTitle) => sopTitle.toLowerCase().includes(normalizedSearchValue)) ||
    statusLabel.includes(normalizedSearchValue)
  )
}

export default function WorkersPage() {
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false)
  const [workerLogs, setWorkerLogs] = useState<WorkerLogRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [selectedWorkerKey, setSelectedWorkerKey] = useState(ALL_WORKERS_VALUE)
  const [selectedSopId, setSelectedSopId] = useState(ALL_SOPS_VALUE)
  const [selectedWorker, setSelectedWorker] = useState<WorkerRow | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadWorkers() {
      const supabase = createClient()
      const user = await getClientAuthenticatedUser(supabase)

      if (!isMounted) {
        return
      }

      if (!user) {
        router.replace('/')
        return
      }

      setIsCheckingSession(false)
      setIsLoadingWorkers(true)

      try {
        const summaryResponse = await fetch('/api/sops', {
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (!summaryResponse.ok) {
          throw new Error('작업자 목록을 불러오지 못했습니다.')
        }

        const summaryPayload = (await summaryResponse.json()) as { sops: ApiSopSummary[] }
        const detailPayloads = await Promise.all(
          summaryPayload.sops.map(async (sop) => {
            const response = await fetch(`/api/sops/${sop.id}`, {
              cache: 'no-store',
              credentials: 'same-origin',
            })

            if (!response.ok) {
              throw new Error('작업자 목록을 불러오지 못했습니다.')
            }

            return (await response.json()) as { sop: ApiSopDetail }
          }),
        )

        const nextWorkerLogs = detailPayloads.flatMap(({ sop }) =>
          sop.education_logs.map((log) => toWorkerLogRow(log, sop.id, sop.title, sop.quiz_questions)),
        )

        if (isMounted) {
          setWorkerLogs(nextWorkerLogs)
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : '작업자 목록을 불러오지 못했습니다.')
          setWorkerLogs([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingWorkers(false)
        }
      }
    }

    loadWorkers()

    return () => {
      isMounted = false
    }
  }, [router])

  const workerFilterOptions = useMemo(() => getWorkerFilterOptions(workerLogs), [workerLogs])
  const sopFilterOptions = useMemo(() => getSopFilterOptions(workerLogs), [workerLogs])

  const filteredLogs = useMemo(
    () =>
      filterWorkerLogs(workerLogs, {
        workerKey: selectedWorkerKey === ALL_WORKERS_VALUE ? undefined : selectedWorkerKey,
        sopId: selectedSopId === ALL_SOPS_VALUE ? undefined : selectedSopId,
      }),
    [selectedSopId, selectedWorkerKey, workerLogs],
  )

  const countWorkers = useMemo(
    () => buildWorkerRows(filteredLogs).filter((worker) => matchesWorkerSearch(worker, searchValue)),
    [filteredLogs, searchValue],
  )

  const filteredWorkers = useMemo(
    () => buildWorkerSopRows(filteredLogs).filter((worker) => matchesWorkerSearch(worker, searchValue)),
    [filteredLogs, searchValue],
  )

  const workerCounts = useMemo(
    () => ({
      total: countWorkers.length,
      safe: countWorkers.filter((worker) => worker.status === 'safe').length,
      warning: countWorkers.filter((worker) => worker.status === 'warning' || worker.status === 'failed').length,
      pending: countWorkers.filter((worker) => worker.status === 'pending').length,
    }),
    [countWorkers],
  )

  const handleWorkerClick = (worker: WorkerRow) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
  }

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
      placeholder="근로자 이름, 생년월일, 안전 관리 가이드 또는 상태로 검색..."
    >
      <main className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-[#333d4b]">근로자</h1>
          <p className="text-[#6b7684]">기록된 근로자 교육 이수 상태를 확인하세요.</p>
        </div>

        {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border border-border">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f3ff] text-[#3182f6]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#6b7684]">전체 근로자</p>
                <p className="text-xl font-bold text-[#333d4b]">{workerCounts.total}명</p>
              </div>
            </CardContent>
          </Card>
          <StatusSummaryCard status="safe" count={workerCounts.safe} />
          <StatusSummaryCard status="warning" count={workerCounts.warning} label="주의/실패" />
          <StatusSummaryCard status="pending" count={workerCounts.pending} />
        </div>

        <Card className="border border-border">
          <CardHeader className="gap-4 pb-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg text-[#333d4b]">근로자 목록</CardTitle>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={selectedWorkerKey} onValueChange={setSelectedWorkerKey}>
                  <SelectTrigger className="h-10 w-full min-w-[220px] border-[#e5e8eb] bg-white">
                    <SelectValue placeholder="근로자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_WORKERS_VALUE}>전체 근로자</SelectItem>
                    {workerFilterOptions.map((worker) => (
                      <SelectItem key={worker.value} value={worker.value}>
                        {worker.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSopId} onValueChange={setSelectedSopId}>
                  <SelectTrigger className="h-10 w-full min-w-[220px] border-[#e5e8eb] bg-white">
                    <SelectValue placeholder="안전 관리 가이드 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SOPS_VALUE}>전체 안전 관리 가이드</SelectItem>
                    {sopFilterOptions.map((sop) => (
                      <SelectItem key={sop.value} value={sop.value}>
                        {sop.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-[#e5e8eb]">
              <div className="grid min-w-[900px] grid-cols-[1.1fr_1fr_1.3fr_0.8fr_0.7fr_1.1fr] gap-4 bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-[#6b7684]">
                <span>이름</span>
                <span>생년월일</span>
                <span>안전 관리 가이드</span>
                <span>상태</span>
                <span>시도</span>
                <span>완료 시간</span>
              </div>

              <div className="divide-y divide-[#e5e8eb]">
                {isLoadingWorkers && (
                  <div className="px-4 py-10 text-center text-sm text-[#8b95a1]">작업자 목록을 불러오는 중입니다...</div>
                )}

                {!isLoadingWorkers &&
                  filteredWorkers.map((worker) => {
                    const config = statusConfig[worker.status]

                    return (
                      <button
                        key={worker.id}
                        type="button"
                        onClick={() => handleWorkerClick(worker)}
                        className="grid min-w-[900px] w-full grid-cols-[1.1fr_1fr_1.3fr_0.8fr_0.7fr_1.1fr] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f2f4f6]"
                      >
                        <span className="font-medium text-[#333d4b]">{worker.name}</span>
                        <span className="text-sm text-[#6b7684]">{worker.birthDate}</span>
                        <span className="min-w-0 text-sm text-[#333d4b]">
                          <span className="block truncate">{worker.sopTitle}</span>
                          {worker.sopCount > 1 && <span className="block truncate text-xs text-[#8b95a1]">{worker.sopTitles.join(', ')}</span>}
                        </span>
                        <span>
                          <Badge className={config.badgeClassName}>{config.label}</Badge>
                        </span>
                        <span className="text-sm text-[#333d4b]">{worker.attempts}회</span>
                        <span className="text-sm text-[#6b7684]">{worker.completedAt ?? '-'}</span>
                      </button>
                    )
                  })}
                </div>

                {!isLoadingWorkers && filteredWorkers.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-[#8b95a1]">조건에 맞는 근로자가 없습니다</div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

      <WorkerDetailModal worker={selectedWorker} open={showWorkerModal} onOpenChange={setShowWorkerModal} />
    </DashboardLayout>
  )
}

function StatusSummaryCard({
  status,
  count,
  label,
}: {
  status: Exclude<WorkerStatus, 'failed'>
  count: number
  label?: string
}) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className="border border-border">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.iconClassName}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-[#6b7684]">{label ?? config.label}</p>
          <p className="text-xl font-bold text-[#333d4b]">{count}명</p>
        </div>
      </CardContent>
    </Card>
  )
}
