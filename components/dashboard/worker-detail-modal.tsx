'use client'

import { useState } from 'react'
import { X, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Worker } from '@/lib/mock-data'

interface WorkerDetailModalProps {
  worker: Worker | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkerDetailModal({ worker, open, onOpenChange }: WorkerDetailModalProps) {
  if (!worker) return null

  const statusConfig = {
    safe: {
      icon: CheckCircle,
      label: '안전',
      color: 'text-[#00d082]',
      bgColor: 'bg-[#e6f9f1]',
    },
    warning: {
      icon: AlertTriangle,
      label: '경고',
      color: 'text-[#b88600]',
      bgColor: 'bg-[#fff4d6]',
    },
    pending: {
      icon: Clock,
      label: '대기',
      color: 'text-[#6b7684]',
      bgColor: 'bg-[#f2f4f6]',
    },
  }

  const config = statusConfig[worker.status]
  const StatusIcon = config.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#333d4b]">근로자 상세 정보</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Worker Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#e8f3ff] flex items-center justify-center text-[#3182f6] text-xl font-bold">
              {worker.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-[#333d4b] text-lg">{worker.name}</h3>
              <p className="text-sm text-[#6b7684]">생년월일: {worker.birthDate}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>상태: {config.label}</span>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#e5e8eb]">
              <span className="text-[#6b7684]">시도 횟수</span>
              <span className="font-medium text-[#333d4b]">{worker.attempts}회</span>
            </div>
            
            {worker.completedAt && (
              <div className="flex items-center justify-between py-3 border-b border-[#e5e8eb]">
                <span className="text-[#6b7684]">완료 시간</span>
                <span className="font-medium text-[#333d4b]">{worker.completedAt}</span>
              </div>
            )}

            {worker.wrongAnswers && worker.wrongAnswers.length > 0 && (
              <div className="py-3">
                <span className="text-[#6b7684] block mb-2">틀린 문제</span>
                <div className="flex flex-wrap gap-2">
                  {worker.wrongAnswers.map((q) => (
                    <span
                      key={q}
                      className="px-3 py-1 bg-[#fff0f0] text-[#f04452] text-sm rounded-full"
                    >
                      문제 {q}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full border-[#e5e8eb]"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
