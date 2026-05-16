import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function readSource(pathFromRoot: string) {
  return readFileSync(new URL(`../../${pathFromRoot}`, import.meta.url), 'utf8')
}

test('public education submission does not request the inserted education log row', () => {
  const source = readSource('lib/workproof/repository.ts')
  const submitResultIndex = source.indexOf('export async function submitEducationResult')

  assert.notEqual(submitResultIndex, -1)

  const submitResultSource = source.slice(submitResultIndex)
  const educationLogsInsertIndex = submitResultSource.indexOf(".from('education_logs')")

  assert.notEqual(educationLogsInsertIndex, -1)

  const insertBlock = submitResultSource.slice(
    educationLogsInsertIndex,
    submitResultSource.indexOf('if (error)', educationLogsInsertIndex),
  )

  assert.match(insertBlock, /\.insert\(/)
  assert.doesNotMatch(insertBlock, /\.select\(/)
  assert.doesNotMatch(insertBlock, /\.single\(/)
})
