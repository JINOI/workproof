'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { WorkerDetailModal } from '@/components/dashboard/worker-detail-modal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockWorkers, type Worker } from '@/lib/mock-data'

const statusConfig = {
  safe: {
    label: '안전',
    icon: CheckCircle,
    badgeClassName: 'bg-[#e6f9f1] text-[#00d082] hover:bg-[#e6f9f1]',
    iconClassName: 'bg-[#e6f9f1] text-[#00d082]',
  },
  warning: {
    label: '경고',
    icon: AlertTriangle,
    badgeClassName: 'bg-[#fff4d6] text-[#b88600] hover:bg-[#fff4d6]',
    iconClassName: 'bg-[#fff4d6] text-[#b88600]',
  },
  pending: {
    label: '대기',
    icon: Clock,
    badgeClassName: 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#f2f4f6]',
    iconClassName: 'bg-[#f2f4f6] text-[#6b7684]',
  },
}

export default function WorkersPage() {
  const [searchValue, setSearchValue] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)

  const normalizedSearchValue = searchValue.trim().toLowerCase()
  const filteredWorkers = mockWorkers.filter((worker) => {
    if (!normalizedSearchValue) {
      return true
    }

    const statusLabel = statusConfig[worker.status].label

    return (
      worker.name.toLowerCase().includes(normalizedSearchValue) ||
      worker.birthDate.includes(normalizedSearchValue) ||
      statusLabel.includes(normalizedSearchValue)
    )
  })

  const workerCounts = {
    total: mockWorkers.length,
    safe: mockWorkers.filter((worker) => worker.status === 'safe').length,
    warning: mockWorkers.filter((worker) => worker.status === 'warning').length,
    pending: mockWorkers.filter((worker) => worker.status === 'pending').length,
  }

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          placeholder="근로자 이름, 생년월일 또는 상태로 검색..."
        />

        <main className="flex-1 p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#333d4b] mb-1">근로자</h1>
            <p className="text-[#6b7684]">근로자 명단과 교육 이수 상태를 확인하세요</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e8f3ff] flex items-center justify-center text-[#3182f6]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">전체 근로자</p>
                  <p className="text-xl font-bold text-[#333d4b]">{workerCounts.total}명</p>
                </div>
              </CardContent>
            </Card>
            <StatusSummaryCard status="safe" count={workerCounts.safe} />
            <StatusSummaryCard status="warning" count={workerCounts.warning} />
            <StatusSummaryCard status="pending" count={workerCounts.pending} />
          </div>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#333d4b]">근로자 명단</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-[#e5e8eb]">
                <div className="grid min-w-[760px] grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1.1fr] gap-4 bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-[#6b7684]">
                  <span>이름</span>
                  <span>생년월일</span>
                  <span>상태</span>
                  <span>시도</span>
                  <span>완료 시간</span>
                </div>

                <div className="divide-y divide-[#e5e8eb]">
                  {filteredWorkers.map((worker) => {
                    const config = statusConfig[worker.status]

                    return (
                      <button
                        key={worker.id}
                        type="button"
                        onClick={() => handleWorkerClick(worker)}
                        className="grid min-w-[760px] w-full grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1.1fr] items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-[#f2f4f6]"
                      >
                        <span className="font-medium text-[#333d4b]">{worker.name}</span>
                        <span className="text-sm text-[#6b7684]">{worker.birthDate}</span>
                        <span>
                          <Badge className={config.badgeClassName}>{config.label}</Badge>
                        </span>
                        <span className="text-sm text-[#333d4b]">{worker.attempts}회</span>
                        <span className="text-sm text-[#6b7684]">{worker.completedAt ?? '-'}</span>
                      </button>
                    )
                  })}
                </div>

                {filteredWorkers.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-[#8b95a1]">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <WorkerDetailModal
        worker={selectedWorker}
        open={showWorkerModal}
        onOpenChange={setShowWorkerModal}
      />
    </div>
  )
}

function StatusSummaryCard({
  status,
  count,
}: {
  status: Worker['status']
  count: number
}) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className="border border-border">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.iconClassName}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-[#6b7684]">{config.label}</p>
          <p className="text-xl font-bold text-[#333d4b]">{count}명</p>
        </div>
      </CardContent>
    </Card>
  )
}
