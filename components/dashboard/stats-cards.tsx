import { AlertTriangle, CheckCircle, FileText, Users } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface StatsCardsProps {
  activeSOPs: number
  totalWorkers: number
  safetyRate: number
  needsAttentionWorkers: number
}

export function StatsCards({ activeSOPs, totalWorkers, safetyRate, needsAttentionWorkers }: StatsCardsProps) {
  const stats = [
    {
      icon: FileText,
      label: '등록된 안전 관리 가이드',
      value: activeSOPs,
      suffix: '개',
      iconBg: 'bg-[#e8f3ff]',
      iconColor: 'text-[#3182f6]',
    },
    {
      icon: Users,
      label: '전체 작업자',
      value: totalWorkers,
      suffix: '명',
      iconBg: 'bg-[#e6f9f1]',
      iconColor: 'text-[#00d082]',
    },
    {
      icon: CheckCircle,
      label: '평균 안전율',
      value: safetyRate,
      suffix: '%',
      iconBg: 'bg-[#fff4d6]',
      iconColor: 'text-[#b88600]',
    },
    {
      icon: AlertTriangle,
      label: '주의 필요',
      value: needsAttentionWorkers,
      suffix: '명',
      iconBg: 'bg-[#f2f4f6]',
      iconColor: 'text-[#6b7684]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-[#6b7684]">{stat.label}</p>
                <p className="text-3xl font-bold text-[#333d4b]">
                  {stat.value}
                  <span className="text-lg font-normal text-[#8b95a1]">{stat.suffix}</span>
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
