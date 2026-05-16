'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Download, Share2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { WorkerDetailModal } from '@/components/dashboard/worker-detail-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockSOPs, mockWorkers, type Worker } from '@/lib/mock-data'

export default function SOPDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)

  const sop = mockSOPs.find(s => s.id === params.id)

  if (!sop) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#6b7684]">SOP를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const safeWorkers = mockWorkers.filter(w => w.status === 'safe')
  const warningWorkers = mockWorkers.filter(w => w.status === 'warning')

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
  }

  const StatusBadge = ({ status }: { status: Worker['status'] }) => {
    const config = {
      safe: { label: '안전', className: 'bg-[#e6f9f1] text-[#00d082] hover:bg-[#e6f9f1]' },
      warning: { label: '경고', className: 'bg-[#fff4d6] text-[#b88600] hover:bg-[#fff4d6]' },
      pending: { label: '대기', className: 'bg-[#f2f4f6] text-[#6b7684] hover:bg-[#f2f4f6]' },
    }
    return <Badge className={config[status].className}>{config[status].label}</Badge>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <Link 
                href="/dashboard" 
                className="flex items-center gap-1 text-sm text-[#6b7684] hover:text-[#333d4b] mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                대시보드로
              </Link>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-[#e8f3ff] text-[#3182f6]">
                  SOP 상세
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-[#333d4b] mb-1">{sop.title}</h1>
              <p className="text-[#6b7684]">
                생성일 {sop.createdAt} · 지원 언어(ko, vi, th) · 교육 대상
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-[#e5e8eb]">
                <Download className="h-4 w-4 mr-2" />
                통합 리포트 (PDF)
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e6f9f1] flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-[#00d082]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">안전 통과</p>
                  <p className="text-xl font-bold text-[#333d4b]">{safeWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#fff4d6] flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-[#b88600]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">경고 / 위험</p>
                  <p className="text-xl font-bold text-[#333d4b]">{warningWorkers.length}명</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#6b7684]" />
                </div>
                <div>
                  <p className="text-sm text-[#6b7684]">교육 대기</p>
                  <p className="text-xl font-bold text-[#333d4b]">0명</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Worker Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Safe Workers */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00d082]"></span>
                  안전 통과 ({safeWorkers.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {safeWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleWorkerClick(worker)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f2f4f6] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e8f3ff] flex items-center justify-center text-[#3182f6] font-medium">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#333d4b]">{worker.name}</p>
                        <p className="text-xs text-[#8b95a1]">완료: {worker.completedAt}</p>
                      </div>
                    </div>
                    <StatusBadge status={worker.status} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Warning Workers */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ffbb00]"></span>
                  경고 / 위험 ({warningWorkers.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {warningWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleWorkerClick(worker)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f2f4f6] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#fff4d6] flex items-center justify-center text-[#b88600] font-medium">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#333d4b]">{worker.name}</p>
                        <p className="text-xs text-[#8b95a1]">시도: {worker.attempts}회</p>
                      </div>
                    </div>
                    <StatusBadge status={worker.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-[#8b95a1] text-center">
            이 페이지 내용, 회사 정보/내용 동의 후에만 이용 리포트/이수 확인의 법적 근거가 됩니다
          </p>
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
