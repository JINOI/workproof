export type WorkerStatus = 'pending' | 'safe' | 'warning' | 'failed'

export type WorkerLogRow = {
  id: string
  name: string
  birthDate: string
  status: WorkerStatus
  attempts: number
  completedAt: string | null
  completedAtSortValue?: string | null
  wrongAnswers: string[]
  sopId: string
  sopTitle: string
}

export type WorkerSummaryRow = WorkerLogRow & {
  workerKey: string
  logCount: number
  sopCount: number
  sopTitles: string[]
}

export type WorkerFilterOption = {
  value: string
  label: string
}

const statusPriority: Record<WorkerStatus, number> = {
  failed: 4,
  warning: 3,
  pending: 2,
  safe: 1,
}

export function normalizeWorkerName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function getWorkerKey(name: string, birthDate: string) {
  return `${normalizeWorkerName(name).toLocaleLowerCase('ko-KR')}|${birthDate}`
}

function compareByLabel(left: WorkerFilterOption, right: WorkerFilterOption) {
  const leftStartsWithAscii = /^[\x00-\x7F]/.test(left.label)
  const rightStartsWithAscii = /^[\x00-\x7F]/.test(right.label)

  if (leftStartsWithAscii !== rightStartsWithAscii) {
    return leftStartsWithAscii ? -1 : 1
  }

  return left.label.localeCompare(right.label, 'ko-KR')
}

function getLatestLog(logs: WorkerLogRow[]) {
  return logs.reduce((latest, log) => {
    const latestValue = latest.completedAtSortValue ?? latest.completedAt ?? ''
    const logValue = log.completedAtSortValue ?? log.completedAt ?? ''

    return logValue > latestValue ? log : latest
  })
}

function getAggregateStatus(logs: WorkerLogRow[]) {
  return logs.reduce<WorkerStatus>((currentStatus, log) => {
    return statusPriority[log.status] > statusPriority[currentStatus] ? log.status : currentStatus
  }, 'safe')
}

function getUniqueWrongAnswers(logs: WorkerLogRow[]) {
  return Array.from(new Set(logs.flatMap((log) => log.wrongAnswers)))
}

function getUniqueSopTitles(logs: WorkerLogRow[]) {
  return Array.from(new Set(logs.map((log) => log.sopTitle))).sort((left, right) => left.localeCompare(right, 'ko-KR'))
}

function groupWorkerLogs(logs: WorkerLogRow[]) {
  const groupedLogs = new Map<string, WorkerLogRow[]>()

  for (const log of logs) {
    const workerKey = getWorkerKey(log.name, log.birthDate)
    const currentLogs = groupedLogs.get(workerKey) ?? []
    groupedLogs.set(workerKey, [...currentLogs, { ...log, name: normalizeWorkerName(log.name) }])
  }

  return groupedLogs
}

export function buildLatestWorkerRows(logs: WorkerLogRow[]): WorkerSummaryRow[] {
  return Array.from(groupWorkerLogs(logs).entries())
    .map(([workerKey, workerLogs]) => {
      const latestLog = getLatestLog(workerLogs)
      const sopTitles = getUniqueSopTitles(workerLogs)

      return {
        ...latestLog,
        id: workerKey,
        workerKey,
        sopTitles,
        sopCount: sopTitles.length,
        logCount: workerLogs.length,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'ko-KR') || left.birthDate.localeCompare(right.birthDate))
}

export function summarizeLatestWorkerCompletion(logs: WorkerLogRow[]) {
  const rows = buildLatestWorkerRows(logs)
  const completedWorkers = rows.filter((row) => row.status === 'safe' || row.status === 'warning').length

  return {
    totalWorkers: rows.length,
    completedWorkers,
    completionRate: rows.length === 0 ? 0 : Math.round((completedWorkers / rows.length) * 100),
  }
}

export function buildWorkerRows(logs: WorkerLogRow[]): WorkerSummaryRow[] {
  const groupedLogs = groupWorkerLogs(logs)

  return Array.from(groupedLogs.entries())
    .map(([workerKey, workerLogs]) => {
      const latestLog = getLatestLog(workerLogs)
      const sopTitles = getUniqueSopTitles(workerLogs)
      const maxAttempts = Math.max(...workerLogs.map((log) => log.attempts))

      return {
        ...latestLog,
        id: workerKey,
        workerKey,
        status: getAggregateStatus(workerLogs),
        attempts: maxAttempts,
        wrongAnswers: getUniqueWrongAnswers(workerLogs),
        sopTitle: sopTitles.length === 1 ? sopTitles[0] : `${sopTitles.length}개 안전 관리 가이드`,
        sopTitles,
        sopCount: sopTitles.length,
        logCount: workerLogs.length,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'ko-KR') || left.birthDate.localeCompare(right.birthDate))
}

export function getWorkerFilterOptions(logs: WorkerLogRow[]): WorkerFilterOption[] {
  const options = new Map<string, WorkerFilterOption>()

  for (const log of logs) {
    const normalizedName = normalizeWorkerName(log.name)
    const value = getWorkerKey(normalizedName, log.birthDate)
    options.set(value, {
      value,
      label: `${normalizedName} / ${log.birthDate}`,
    })
  }

  return Array.from(options.values()).sort(compareByLabel)
}

export function getSopFilterOptions(logs: WorkerLogRow[]): WorkerFilterOption[] {
  const options = new Map<string, WorkerFilterOption>()

  for (const log of logs) {
    options.set(log.sopId, {
      value: log.sopId,
      label: log.sopTitle,
    })
  }

  return Array.from(options.values()).sort(compareByLabel)
}

export function filterWorkerLogs(
  logs: WorkerLogRow[],
  filters: {
    workerKey?: string
    sopId?: string
    searchValue?: string
  },
) {
  const normalizedSearchValue = filters.searchValue?.trim().toLowerCase() ?? ''

  return logs.filter((log) => {
    if (filters.workerKey && getWorkerKey(log.name, log.birthDate) !== filters.workerKey) {
      return false
    }

    if (filters.sopId && log.sopId !== filters.sopId) {
      return false
    }

    if (!normalizedSearchValue) {
      return true
    }

    return (
      normalizeWorkerName(log.name).toLowerCase().includes(normalizedSearchValue) ||
      log.birthDate.includes(normalizedSearchValue) ||
      log.sopTitle.toLowerCase().includes(normalizedSearchValue)
    )
  })
}
