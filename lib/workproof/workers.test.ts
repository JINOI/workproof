import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildLatestWorkerRows,
  buildWorkerSopRows,
  buildWorkerRows,
  filterWorkerLogs,
  getSopFilterOptions,
  getWorkerFilterOptions,
  getWorkerKey,
  summarizeLatestWorkerCompletion,
  type WorkerLogRow,
} from './workers.ts'

const logs: WorkerLogRow[] = [
  {
    id: 'log-1',
    name: '김 안전',
    birthDate: '1990-01-01',
    status: 'safe',
    attempts: 1,
    completedAt: '2026. 05. 16. 10:00',
    wrongAnswers: [],
    sopId: 'sop-a',
    sopTitle: '지게차 안전',
  },
  {
    id: 'log-2',
    name: ' 김   안전 ',
    birthDate: '1990-01-01',
    status: 'warning',
    attempts: 2,
    completedAt: '2026. 05. 16. 11:00',
    wrongAnswers: ['q-1'],
    sopId: 'sop-b',
    sopTitle: 'LOTO 절차',
  },
  {
    id: 'log-3',
    name: '박 보건',
    birthDate: '1992-02-02',
    status: 'safe',
    attempts: 1,
    completedAt: '2026. 05. 16. 12:00',
    wrongAnswers: [],
    sopId: 'sop-a',
    sopTitle: '지게차 안전',
  },
]

const repeatedSopLogs: WorkerLogRow[] = [
  {
    id: 'old-failed',
    name: 'Alice Kim',
    birthDate: '1990-01-01',
    status: 'failed',
    attempts: 1,
    completedAt: '2026. 05. 16. 09:00',
    completedAtSortValue: '2026-05-16T00:00:00.000Z',
    wrongAnswers: ['q-1'],
    sopId: 'sop-a',
    sopTitle: 'Forklift Safety',
  },
  {
    id: 'middle-warning',
    name: ' Alice   Kim ',
    birthDate: '1990-01-01',
    status: 'warning',
    attempts: 2,
    completedAt: '2026. 05. 16. 10:00',
    completedAtSortValue: '2026-05-16T01:00:00.000Z',
    wrongAnswers: ['q-2'],
    sopId: 'sop-a',
    sopTitle: 'Forklift Safety',
  },
  {
    id: 'latest-safe',
    name: 'Alice Kim',
    birthDate: '1990-01-01',
    status: 'safe',
    attempts: 3,
    completedAt: '2026. 05. 16. 11:00',
    completedAtSortValue: '2026-05-16T02:00:00.000Z',
    wrongAnswers: [],
    sopId: 'sop-a',
    sopTitle: 'Forklift Safety',
  },
  {
    id: 'bob-pending',
    name: 'Bob Park',
    birthDate: '1991-02-02',
    status: 'pending',
    attempts: 0,
    completedAt: null,
    completedAtSortValue: null,
    wrongAnswers: [],
    sopId: 'sop-a',
    sopTitle: 'Forklift Safety',
  },
]

test('groups education logs by worker name and birth date', () => {
  const rows = buildWorkerRows(logs)

  assert.equal(rows.length, 2)
  assert.deepEqual(
    rows.map((row) => [row.name, row.birthDate, row.sopCount, row.sopTitle, row.status]),
    [
      ['김 안전', '1990-01-01', 2, '2개 SOP', 'warning'],
      ['박 보건', '1992-02-02', 1, '지게차 안전', 'safe'],
    ],
  )
})

test('separates worker rows by SOP for the workers table', () => {
  const rows = buildWorkerSopRows(logs)

  assert.equal(rows.length, 3)
  assert.deepEqual(
    rows.map((row) => [row.name, row.birthDate, row.sopCount, row.sopTitle, row.status]),
    [
      ['김 안전', '1990-01-01', 1, '지게차 안전', 'safe'],
      ['김 안전', '1990-01-01', 1, 'LOTO 절차', 'warning'],
      ['박 보건', '1992-02-02', 1, '지게차 안전', 'safe'],
    ],
  )

  assert.equal(buildWorkerRows(logs).length, 2)
})

test('builds stable worker and SOP dropdown options', () => {
  assert.deepEqual(getWorkerFilterOptions(logs), [
    { value: getWorkerKey('김 안전', '1990-01-01'), label: '김 안전 / 1990-01-01' },
    { value: getWorkerKey('박 보건', '1992-02-02'), label: '박 보건 / 1992-02-02' },
  ])

  assert.deepEqual(getSopFilterOptions(logs), [
    { value: 'sop-b', label: 'LOTO 절차' },
    { value: 'sop-a', label: '지게차 안전' },
  ])
})

test('filters logs by selected worker and SOP before grouping', () => {
  const selectedLogs = filterWorkerLogs(logs, {
    workerKey: getWorkerKey('김 안전', '1990-01-01'),
    sopId: 'sop-b',
    searchValue: '',
  })
  const rows = buildWorkerRows(selectedLogs)

  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, '김 안전')
  assert.equal(rows[0].sopTitle, 'LOTO 절차')
  assert.equal(rows[0].status, 'warning')
})

test('uses each worker latest log when summarizing one SOP', () => {
  const rows = buildLatestWorkerRows(repeatedSopLogs)
  const alice = rows.find((row) => row.workerKey === getWorkerKey('Alice Kim', '1990-01-01'))

  assert.equal(rows.length, 2)
  assert.ok(alice)
  assert.equal(alice.id, getWorkerKey('Alice Kim', '1990-01-01'))
  assert.equal(alice.name, 'Alice Kim')
  assert.equal(alice.status, 'safe')
  assert.equal(alice.attempts, 3)
  assert.equal(alice.completedAt, '2026. 05. 16. 11:00')
  assert.deepEqual(alice.wrongAnswers, [])
  assert.equal(alice.logCount, 3)
  assert.equal(alice.sopCount, 1)
})

test('counts SOP completion from latest worker logs only', () => {
  assert.deepEqual(summarizeLatestWorkerCompletion(repeatedSopLogs), {
    totalWorkers: 2,
    completedWorkers: 1,
    completionRate: 50,
  })
})
