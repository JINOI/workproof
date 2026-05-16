export type DashboardStatsSnapshot = {
  activeSOPs: number
  totalWorkers: number
  safetyRate: number
  needsAttentionWorkers: number
  savedAt: string
}

export type DashboardStatTrend = {
  label: string
  tone: 'positive' | 'negative' | 'neutral'
}

const SNAPSHOT_STORAGE_KEY = 'workproof-dashboard-stats-v1'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function readDashboardStatsSnapshot(): DashboardStatsSnapshot | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(SNAPSHOT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as DashboardStatsSnapshot
  } catch {
    return null
  }
}

export function writeDashboardStatsSnapshot(snapshot: Omit<DashboardStatsSnapshot, 'savedAt'>) {
  if (typeof window === 'undefined') {
    return
  }

  const payload: DashboardStatsSnapshot = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(payload))
}

function formatDelta(value: number, unit: string) {
  if (value === 0) {
    return '변화 없음'
  }

  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${unit}`
}

function trendFromDelta(delta: number, unit: string, periodLabel = '지난 방문 대비'): DashboardStatTrend {
  if (delta === 0) {
    return { label: `${periodLabel} 변화 없음`, tone: 'neutral' }
  }

  return {
    label: `${periodLabel} ${formatDelta(delta, unit)}`,
    tone: delta > 0 ? 'positive' : 'negative',
  }
}

export function buildDashboardStatTrends(
  stats: Omit<DashboardStatsSnapshot, 'savedAt'>,
  sops: Array<{ created_at: string }>,
  previousSnapshot: DashboardStatsSnapshot | null,
): {
  activeSOPs: DashboardStatTrend
  totalWorkers: DashboardStatTrend
  safetyRate: DashboardStatTrend
  needsAttentionWorkers: DashboardStatTrend
} {
  const weekAgo = Date.now() - WEEK_MS
  const newGuidesThisWeek = sops.filter((sop) => new Date(sop.created_at).getTime() >= weekAgo).length

  const activeSOPsTrend: DashboardStatTrend =
    newGuidesThisWeek > 0
      ? { label: `이번 주 +${newGuidesThisWeek}개 등록`, tone: 'positive' }
      : { label: '이번 주 신규 가이드 없음', tone: 'neutral' }

  const totalWorkersTrend = previousSnapshot
    ? trendFromDelta(stats.totalWorkers - previousSnapshot.totalWorkers, '명')
    : { label: '실시간 집계 기준', tone: 'neutral' }

  const safetyRateTrend = previousSnapshot
    ? trendFromDelta(stats.safetyRate - previousSnapshot.safetyRate, '%p')
    : { label: '실시간 집계 기준', tone: 'neutral' }

  const pendingDelta = previousSnapshot
    ? stats.needsAttentionWorkers - previousSnapshot.needsAttentionWorkers
    : 0
  const needsAttentionWorkersTrend: DashboardStatTrend = !previousSnapshot
    ? stats.needsAttentionWorkers === 0
      ? { label: '미이수 작업자 없음', tone: 'positive' }
      : { label: '확인이 필요한 작업자 있음', tone: 'negative' }
    : pendingDelta === 0
      ? { label: '지난 방문과 동일', tone: 'neutral' }
      : pendingDelta < 0
        ? { label: `지난 방문 대비 ${formatDelta(pendingDelta, '명')}`, tone: 'positive' }
        : { label: `지난 방문 대비 ${formatDelta(pendingDelta, '명')}`, tone: 'negative' }

  return {
    activeSOPs: activeSOPsTrend,
    totalWorkers: totalWorkersTrend,
    safetyRate: safetyRateTrend,
    needsAttentionWorkers: needsAttentionWorkersTrend,
  }
}
