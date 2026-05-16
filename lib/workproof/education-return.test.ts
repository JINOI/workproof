import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readSource(pathFromRoot: string) {
  return readFileSync(new URL(`../../${pathFromRoot}`, import.meta.url), 'utf8')
}

test('company education selection passes a return path into the education flow', () => {
  const source = readSource('app/education/company/[companyToken]/page.tsx')

  assert.match(source, /returnTo=/)
  assert.match(source, /encodeURIComponent\(`\/education\/company\/\$\{params\.companyToken\}`\)/)
})

test('education completion screen can return to the training selection page', () => {
  const source = readSource('app/education/[sopId]/page.tsx')

  assert.match(source, /useSearchParams/)
  assert.match(source, /처음으로 돌아가기/)
  assert.match(source, /router\.push\(returnTo\)/)
})
