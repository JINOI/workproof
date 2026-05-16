import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { formatDashboardTitle } from './dashboard.ts'

function readSource(pathFromRoot: string) {
  return readFileSync(new URL(`../../${pathFromRoot}`, import.meta.url), 'utf8')
}

test('dashboard and safety management guide pages move the company QR trigger into the page header slot', () => {
  for (const pagePath of ['app/dashboard/page.tsx', 'app/sop/page.tsx']) {
    const source = readSource(pagePath)

    assert.match(source, /import \{[^}]*CompanyQrDialogButton[^}]*\} from '@\/components\/dashboard\/company-qr'/)
    assert.doesNotMatch(source, /CompanyQrPanel/)
    assert.match(source, /<DashboardLayout[\s\S]*headerActions=\{<CompanyQrDialogButton \/>\}/)
  }
})

test('landing page does not show worker QR trial button', () => {
  const source = readSource('app/page.tsx')

  assert.doesNotMatch(source, /근로자 QR 체험하기|QR 체험/)
  assert.doesNotMatch(source, /DEFAULT_WORKER_EDUCATION_PATH/)
})

test('dashboard title uses the organization name', () => {
  const source = readSource('app/dashboard/page.tsx')

  assert.equal(formatDashboardTitle('온화건설'), '온화건설의 대시보드')
  assert.equal(formatDashboardTitle('  '), '회사의 대시보드')
  assert.match(source, /formatDashboardTitle\(companyQr\?\.organizationName\)/)
  assert.doesNotMatch(source, />\s*관리자 대시보드\s*</)
})

test('dashboard layout passes header actions into the dashboard header', () => {
  const source = readSource('components/dashboard/dashboard-layout.tsx')

  assert.match(source, /<DashboardHeader[\s\S]*headerActions=\{headerActions\}/)
})

test('dashboard page disables the header search while SOP management keeps it enabled', () => {
  const dashboardSource = readSource('app/dashboard/page.tsx')
  const dashboardLayoutTag = dashboardSource.match(/<DashboardLayout[\s\S]*?>/)?.[0] ?? ''

  assert.doesNotMatch(dashboardLayoutTag, /searchValue=|onSearchChange=|placeholder=/)
  assert.doesNotMatch(dashboardSource, /const \[searchValue/)
  assert.doesNotMatch(dashboardSource, /filteredSOPs/)

  const sopSource = readSource('app/sop/page.tsx')
  const sopLayoutTag = sopSource.match(/<DashboardLayout[\s\S]*?>/)?.[0] ?? ''

  assert.match(sopLayoutTag, /searchValue=\{searchValue\}/)
  assert.match(sopLayoutTag, /onSearchChange=\{setSearchValue\}/)
})

test('safety management guide detail page does not show a report export button', () => {
  const source = readSource('app/sop/[id]/page.tsx')

  assert.doesNotMatch(source, /리포트\s*(다운로드|추출)/)
  assert.doesNotMatch(source, /\bDownload\b/)
})

test('company QR dialog trigger uses the requested button label', () => {
  const source = readSource('components/dashboard/company-qr.tsx')

  assert.match(source, />\s*회사 QR코드 확인하기\s*</)
})
