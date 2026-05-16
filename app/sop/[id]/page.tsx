'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Download, QrCode, Share2 } from 'lucide-react'

import { DashboardHeader } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { type WorkerDetail, WorkerDetailModal } from '@/components/dashboard/worker-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type EducationLog = {
  id: string
  worker_name: string
  worker_birth_date: string
  status: 'pending' | 'safe' | 'warning' | 'failed'
  attempts: number
  completed_at: string | null
  wrong_question_ids: string[]
}

type ApiSopDetail = {
  id: string
  title: string
  description: string | null
  created_at: string
  languages: string[]
  public_token: string
  status: 'draft' | 'active' | 'archived'
  education_logs: EducationLog[]
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function toWorkerDetail(log: EducationLog): WorkerDetail {
  return {
    id: log.id,
    name: log.worker_name,
    birthDate: log.worker_birth_date,
    status: log.status,
    attempts: log.attempts,
    completedAt: formatDateTime(log.completed_at),
    wrongAnswers: log.wrong_question_ids,
  }
}

function StatusBadge({ status }: { status: WorkerDetail['status'] }) {
  const config = {
    safe: { label: '안전', className: 'bg-[#e6f9f1] text-[#00d082] hover:bg-[#e6f9f1]' },
    warning: { label: '주의', className: 'bg-[#fff4d6] text-[#b88600] hover:bg-[#fff4d6]' },
    failed: { label: '실패', className: 'bg-[#fff0f0] text-[#f04452] hover:bg-[#fff0f0]' },
    pending: { label: '대기', className: 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#f2f4f6]' },
  }

  return <Badge className={config[status].className}>{config[status].label}</Badge>
}

export default function SOPDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetail | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [sop, setSop] = useState<ApiSopDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadSop() {
      try {
        const response = await fetch(`/api/sops/${params.id}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (response.status === 404) {
          router.replace('/dashboard')
          return
        }

        if (!response.ok) {
          throw new Error('SOP 상세 정보를 불러오지 못했습니다.')
        }

        const payload = (await response.json()) as { sop: ApiSopDetail }

        if (isMounted) {
          setSop(payload.sop)
          setLoadError(null)
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'SOP 상세 정보를 불러오지 못했습니다.')
          setSop(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSop()

    return () => {
      isMounted = false
    }
  }, [params.id, router])

  const workers = useMemo(() => sop?.education_logs.map(toWorkerDetail) ?? [], [sop])
  const filteredWorkers = useMemo(
    () => workers.filter((worker) => worker.name.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue, workers],
  )
  const safeWorkers = workers.filter((worker) => worker.status === 'safe')
  const warningWorkers = workers.filter((worker) => worker.status === 'warning' || worker.status === 'failed')
  const pendingWorkers = workers.filter((worker) => worker.status === 'pending')

  const handleWorkerClick = (worker: WorkerDetail) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <DashboardHeader searchValue={searchValue} onSearchChange={setSearchValue} placeholder="작업자를 검색하세요" />

        <main className="flex-1 space-y-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <Link href="/dashboard" className="mb-4 flex items-center gap-1 text-sm text-[#6b7684] hover:text-[#333d4b]">
                <ArrowLeft className="h-4 w-4" />
                대시보드로 돌아가기
              </Link>
              <Badge variant="secondary" className="mb-2 bg-[#e8f3ff] text-[#3182f6]">
                SOP 상세
              </Badge>
              <h1 className="mb-1 text-2xl font-bold text-[#333d4b]">
                {isLoading ? '불러오는 중...' : sop?.title ?? 'SOP를 찾을 수 없습니다'}
              </h1>
              {sop && (
                <p className="text-[#6b7684]">
                  생성일 {formatDate(sop.created_at)} · 언어 {sop.languages.join(', ')} · 상태 {sop.status}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-[#e5e8eb]" disabled={!sop}>
                <Download className="mr-2 h-4 w-4" />
                리포트 다운로드
              </Button>
              <Button variant="outline" className="border-[#e5e8eb]" disabled={!sop}>
                <QrCode className="mr-2 h-4 w-4" />
                QR 보기
              </Button>
              <Button className="bg-[#3182f6] text-white hover:bg-[#1b64da]" disabled={!sop}>
                <Share2 className="mr-2 h-4 w-4" />
                공유
              </Button>
            </div>
          </div>

          {loadError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6f9f1]">
                  <CheckCircle className="h-5 w-5 text-[#00d082]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">안전 완료</p>
                  <p className="text-xl font-bold text-[#333d4b]">{safeWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff4d6]">
                  <AlertTriangle className="h-5 w-5 text-[#b88600]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">주의/실패</p>
                  <p className="text-xl font-bold text-[#333d4b]">{warningWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2f4f6]">
                  <Clock className="h-5 w-5 text-[#6b7684]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">대기</p>
                  <p className="text-xl font-bold text-[#333d4b]">{pendingWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">작업자 이수 현황</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isLoading && filteredWorkers.length === 0 && (
                <div className="rounded-lg border border-dashed border-[#e5e8eb] p-8 text-center text-sm text-[#6b7684]">
                  이 SOP에 등록된 작업자 이수 기록이 없습니다.
                </div>
              )}

              {filteredWorkers.map((worker) => (
                <button
                  key={worker.id}
                  type="button"
                  onClick={() => handleWorkerClick(worker)}
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-[#f2f4f6]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f3ff] font-medium text-[#3182f6]">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#333d4b]">{worker.name}</p>
                      <p className="text-xs text-[#8b95a1]">
                        {worker.completedAt ? `완료: ${worker.completedAt}` : '아직 완료되지 않음'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={worker.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>

      <WorkerDetailModal worker={selectedWorker} open={showWorkerModal} onOpenChange={setShowWorkerModal} />
    </div>
  )
}
