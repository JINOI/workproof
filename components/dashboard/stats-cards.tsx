import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardStatTrend } from '@/lib/workproof/dashboard-stats'

interface StatsCardsProps {
  activeSOPs: number
  totalWorkers: number
  safetyRate: number
  needsAttentionWorkers: number
  trends?: {
    activeSOPs?: DashboardStatTrend
    totalWorkers?: DashboardStatTrend
    safetyRate?: DashboardStatTrend
    needsAttentionWorkers?: DashboardStatTrend
  }
}

const kpiNumberGradient =
  'bg-gradient-to-r from-blue-600 to-emerald-400 bg-clip-text text-transparent'

const trendToneClass = {
  positive: 'text-[#2563eb]',
  negative: 'text-[#2563eb]/50',
  neutral: 'text-[#8b95a1]',
} as const

function StatCard({
  value,
  suffix,
  label,
  trend,
}: {
  value: number
  suffix: string
  label: string
  trend?: DashboardStatTrend
}) {
  return (
    <Card
      className={cn(
        'group overflow-hidden border border-[#e5e8eb] bg-white py-0 shadow-sm',
        'bg-[linear-gradient(135deg,rgba(37,99,235,0.04),rgba(52,211,153,0.04))]',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-2 hover:border-[rgba(37,99,235,0.22)] hover:shadow-lg',
        'hover:bg-[linear-gradient(135deg,rgba(37,99,235,0.06),rgba(52,211,153,0.06))]',
      )}
    >
      <div
        aria-hidden
        className="h-1 w-full bg-[linear-gradient(90deg,#2563eb_0%,#34d399_100%)] opacity-85 transition-opacity duration-200 group-hover:opacity-100"
      />
      <div className="px-5 pt-4 pb-5">
        <p className="text-sm font-medium text-[#8b95a1]">{label}</p>
        <div className="mt-2 flex items-end gap-0.5">
          <p className={cn('text-5xl leading-none font-bold tracking-tight tabular-nums', kpiNumberGradient)}>
            {value}
          </p>
          {suffix ? <span className="mb-1 text-lg font-medium text-[#8b95a1]">{suffix}</span> : null}
        </div>
        {trend ? (
          <p className={cn('mt-3 text-xs font-medium', trendToneClass[trend.tone])}>{trend.label}</p>
        ) : null}
      </div>
    </Card>
  )
}

export function StatsCards({
  activeSOPs,
  totalWorkers,
  safetyRate,
  needsAttentionWorkers,
  trends,
}: StatsCardsProps) {
  const stats = [
    { value: activeSOPs, suffix: '개', label: '등록 가이드', trendKey: 'activeSOPs' as const },
    { value: totalWorkers, suffix: '명', label: '전체 작업자', trendKey: 'totalWorkers' as const },
    { value: safetyRate, suffix: '%', label: '평균 이수율', trendKey: 'safetyRate' as const },
    {
      value: needsAttentionWorkers,
      suffix: '명',
      label: '미이수 작업자',
      trendKey: 'needsAttentionWorkers' as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          value={stat.value}
          suffix={stat.suffix}
          label={stat.label}
          trend={trends?.[stat.trendKey]}
        />
      ))}
    </div>
  )
}
