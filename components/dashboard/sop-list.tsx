'use client'

import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SOP } from '@/lib/mock-data'

interface SOPListProps {
  sops: SOP[]
  onNewSOP?: () => void
}

export function SOPList({ sops, onNewSOP }: SOPListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#333d4b]">SOP 목록</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New SOP Card */}
        <Card 
          className="border-2 border-dashed border-[#e5e8eb] hover:border-[#3182f6] cursor-pointer transition-colors group"
          onClick={onNewSOP}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[180px] text-center">
            <div className="w-12 h-12 rounded-full bg-[#e8f3ff] flex items-center justify-center mb-4 group-hover:bg-[#3182f6] transition-colors">
              <Plus className="h-6 w-6 text-[#3182f6] group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-medium text-[#333d4b] mb-1">새로운 SOP</h3>
            <p className="text-sm text-[#8b95a1]">등록 안내 - 아래 버튼을 클릭</p>
          </CardContent>
        </Card>

        {/* SOP Cards */}
        {sops.filter(sop => sop.id !== '2').map((sop) => (
          <Link href={`/sop/${sop.id}`} key={sop.id}>
            <Card className="border border-border hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#e8f3ff] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-[#3182f6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#8b95a1] mb-1">{sop.createdAt}</p>
                    <h3 className="font-medium text-[#333d4b] truncate">{sop.title}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[#6b7684]">이수율</span>
                      <span className="font-medium text-[#333d4b]">{sop.completionRate}%</span>
                    </div>
                    <Progress value={sop.completionRate} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6b7684]">
                      완료 <span className="text-[#00d082] font-medium">{sop.completedWorkers}</span> / 
                      대기 <span className="text-[#f04452] font-medium">{sop.totalWorkers - sop.completedWorkers}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
