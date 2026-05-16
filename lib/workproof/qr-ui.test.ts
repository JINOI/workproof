import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readSource(pathFromRoot: string) {
  return readFileSync(new URL(`../../${pathFromRoot}`, import.meta.url), 'utf8')
}

test('dashboard and SOP pages move the company QR trigger into the page header slot', () => {
  for (const pagePath of ['app/dashboard/page.tsx', 'app/sop/page.tsx']) {
    const source = readSource(pagePath)

    assert.match(source, /import \{ CompanyQrDialogButton \} from '@\/components\/dashboard\/company-qr'/)
    assert.doesNotMatch(source, /CompanyQrPanel/)
    assert.match(source, /<DashboardLayout[\s\S]*headerActions=\{<CompanyQrDialogButton \/>\}/)
  }
})

test('dashboard layout passes header actions into the dashboard header', () => {
  const source = readSource('components/dashboard/dashboard-layout.tsx')

  assert.match(source, /<DashboardHeader[\s\S]*headerActions=\{headerActions\}/)
})

test('company QR dialog trigger uses the requested button label', () => {
  const source = readSource('components/dashboard/company-qr.tsx')

  assert.match(source, />\s*회사 QR코드 확인하기\s*</)
})
