'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, LoaderCircle, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export interface DashboardSop {
  id: string
  title: string
  description: string | null
  createdAt: string
  totalWorkers: number
  completedWorkers: number
  completionRate: number
}

interface SOPListProps {
  sops: DashboardSop[]
  isLoading?: boolean
  onNewSOP?: () => void
  onSOPDeleted?: (sopId: string) => void
  onDeleteError?: (message: string) => void
}

export function SOPList({ sops, isLoading = false, onNewSOP, onSOPDeleted, onDeleteError }: SOPListProps) {
  const [deletingSopId, setDeletingSopId] = useState<string | null>(null)

  async function handleDeleteSop(sop: DashboardSop) {
    const confirmed = window.confirm(`"${sop.title}" SOP를 삭제할까요?\n퀴즈와 근로자 이수 기록도 함께 삭제됩니다.`)

    if (!confirmed) {
      return
    }

    setDeletingSopId(sop.id)

    try {
      const response = await fetch(`/api/sops/${sop.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? 'SOP를 삭제하지 못했습니다.')
      }

      onSOPDeleted?.(sop.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SOP를 삭제하지 못했습니다.'

      if (onDeleteError) {
        onDeleteError(message)
      } else {
        window.alert(message)
      }
    } finally {
      setDeletingSopId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#333d4b]">SOP 목록</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer border-2 border-dashed border-[#e5e8eb] transition-colors hover:border-[#3182f6]"
          onClick={onNewSOP}
        >
          <CardContent className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f3ff] transition-colors">
              <Plus className="h-6 w-6 text-[#3182f6]" />
            </div>
            <h3 className="mb-1 font-medium text-[#333d4b]">새 SOP 등록</h3>
            <p className="text-sm text-[#8b95a1]">PDF 또는 문서를 업로드해 교육 콘텐츠를 만듭니다.</p>
          </CardContent>
        </Card>

        {isLoading && (
          <Card className="border border-border">
            <CardContent className="flex min-h-[180px] items-center justify-center p-6 text-sm text-[#6b7684]">
              SOP를 불러오는 중입니다...
            </CardContent>
          </Card>
        )}

        {!isLoading && sops.length === 0 && (
          <Card className="border border-border">
            <CardContent className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center">
              <FileText className="mb-3 h-8 w-8 text-[#8b95a1]" />
              <h3 className="mb-1 font-medium text-[#333d4b]">아직 등록된 SOP가 없습니다.</h3>
              <p className="text-sm text-[#8b95a1]">새 계정에서는 예시 SOP가 표시되지 않습니다.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          sops.map((sop) => (
            <Card key={sop.id} className="relative h-full border border-border transition-shadow hover:shadow-md">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3 z-10 text-[#8b95a1] hover:bg-red-50 hover:text-red-600"
                aria-label={`${sop.title} 삭제`}
                title="SOP 삭제"
                disabled={deletingSopId !== null}
                onClick={() => handleDeleteSop(sop)}
              >
                {deletingSopId === sop.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>

              <Link href={`/sop/${sop.id}`} className="block h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ff]">
                      <FileText className="h-5 w-5 text-[#3182f6]" />
                    </div>
                    <div className="min-w-0 pr-8">
                      <p className="mb-1 text-xs text-[#8b95a1]">{sop.createdAt}</p>
                      <h3 className="truncate font-medium text-[#333d4b]">{sop.title}</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-[#6b7684]">이수율</span>
                        <span className="font-medium text-[#333d4b]">{sop.completionRate}%</span>
                      </div>
                      <Progress value={sop.completionRate} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6b7684]">
                        완료 <span className="font-medium text-[#00d082]">{sop.completedWorkers}</span> / 전체{' '}
                        <span className="font-medium text-[#333d4b]">{sop.totalWorkers}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
      </div>
    </div>
  )
}
