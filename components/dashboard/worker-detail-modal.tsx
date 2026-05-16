'use client'

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export interface WorkerDetail {
  id: string
  name: string
  birthDate: string
  status: 'pending' | 'safe' | 'warning' | 'failed'
  attempts: number
  completedAt: string | null
  wrongAnswers: string[]
}

interface WorkerDetailModalProps {
  worker: WorkerDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig = {
  safe: {
    icon: CheckCircle,
    label: '안전',
    color: 'text-[#00d082]',
    bgColor: 'bg-[#e6f9f1]',
  },
  warning: {
    icon: AlertTriangle,
    label: '주의',
    color: 'text-[#b88600]',
    bgColor: 'bg-[#fff4d6]',
  },
  failed: {
    icon: AlertTriangle,
    label: '실패',
    color: 'text-[#f04452]',
    bgColor: 'bg-[#fff0f0]',
  },
  pending: {
    icon: Clock,
    label: '대기',
    color: 'text-[#6b7684]',
    bgColor: 'bg-[#f2f4f6]',
  },
}

export function WorkerDetailModal({ worker, open, onOpenChange }: WorkerDetailModalProps) {
  if (!worker) return null

  const config = statusConfig[worker.status]
  const StatusIcon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#333d4b]">작업자 상세</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f3ff] text-xl font-bold text-[#3182f6]">
              {worker.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#333d4b]">{worker.name}</h3>
              <p className="text-sm text-[#6b7684]">생년월일: {worker.birthDate}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${config.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>상태: {config.label}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5e8eb] py-3">
              <span className="text-[#6b7684]">시도 횟수</span>
              <span className="font-medium text-[#333d4b]">{worker.attempts}회</span>
            </div>

            {worker.completedAt && (
              <div className="flex items-center justify-between border-b border-[#e5e8eb] py-3">
                <span className="text-[#6b7684]">완료 시간</span>
                <span className="font-medium text-[#333d4b]">{worker.completedAt}</span>
              </div>
            )}

            {worker.wrongAnswers.length > 0 && (
              <div className="py-3">
                <span className="mb-2 block text-[#6b7684]">오답 문항</span>
                <div className="flex flex-wrap gap-2">
                  {worker.wrongAnswers.map((questionId) => (
                    <span key={questionId} className="rounded-full bg-[#fff0f0] px-3 py-1 text-sm text-[#f04452]">
                      {questionId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full border-[#e5e8eb]" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
