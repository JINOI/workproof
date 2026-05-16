import { FileText, Users, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardsProps {
  activeSOPs: number
  totalWorkers: number
  completionRate: number
  pendingWorkers: number
}

export function StatsCards({ activeSOPs, totalWorkers, completionRate, pendingWorkers }: StatsCardsProps) {
  const stats = [
    {
      icon: FileText,
      label: '활성 SOP',
      value: activeSOPs,
      suffix: '',
      iconBg: 'bg-[#e8f3ff]',
      iconColor: 'text-[#3182f6]',
    },
    {
      icon: Users,
      label: '전체 근로자',
      value: totalWorkers,
      suffix: '명',
      iconBg: 'bg-[#e6f9f1]',
      iconColor: 'text-[#00d082]',
    },
    {
      icon: CheckCircle,
      label: '완료 이수율',
      value: completionRate,
      suffix: '%',
      iconBg: 'bg-[#fff4d6]',
      iconColor: 'text-[#b88600]',
    },
    {
      icon: Clock,
      label: '교육 대기',
      value: pendingWorkers,
      suffix: '명',
      iconBg: 'bg-[#f2f4f6]',
      iconColor: 'text-[#6b7684]',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[#6b7684] mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-[#333d4b]">
                  {stat.value}
                  <span className="text-lg font-normal text-[#8b95a1]">{stat.suffix}</span>
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
