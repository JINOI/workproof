import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pidFile = path.join(repoRoot, '.next', 'workproof-dev.pid')
const quiet = process.argv.includes('--quiet')

function log(message) {
  if (!quiet) console.log(message)
}

function killTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return false

  if (process.platform === 'win32') {
    const result = spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
    })
    return result.status === 0
  }

  try {
    process.kill(pid, 'SIGTERM')
    return true
  } catch {
    return false
  }
}

function stopPidFileTarget() {
  if (!existsSync(pidFile)) return 0

  try {
    const state = JSON.parse(readFileSync(pidFile, 'utf8'))
    const pid = Number(state.pid)
    if (killTree(pid)) {
      log(`Stopped tracked Next dev server pid ${pid}.`)
      return 1
    }
  } catch {
    // Ignore stale or malformed state and remove it below.
  } finally {
    rmSync(pidFile, { force: true })
  }

  return 0
}

function psSingleQuote(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function stopWindowsFallbackTargets() {
  if (process.platform !== 'win32') return 0

  const script = `
$root = ${psSingleQuote(repoRoot)}
$nodes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'"
$repoNextServers = $nodes |
  Where-Object {
    $_.ProcessId -ne ${process.pid} -and
    $_.CommandLine -and
    $_.CommandLine.Contains($root) -and
    (
      $_.CommandLine.Contains('next dev') -or
      $_.CommandLine.Contains('start-server.js')
    )
  }

$targetIds = New-Object 'System.Collections.Generic.HashSet[int]'

foreach ($server in $repoNextServers) {
  $candidate = [int]$server.ProcessId
  $current = $server

  while ($true) {
    $parent = $nodes | Where-Object { $_.ProcessId -eq $current.ParentProcessId } | Select-Object -First 1
    if (-not $parent -or -not $parent.CommandLine) {
      break
    }

    if (
      $parent.CommandLine.Contains('scripts/dev-server.mjs') -or
      $parent.CommandLine.Contains('scripts\\dev-server.mjs') -or
      ($parent.CommandLine.Contains('npm-cli.js') -and $parent.CommandLine.Contains(' run dev'))
    ) {
      $candidate = [int]$parent.ProcessId
      $current = $parent
      continue
    }

    break
  }

  if ($candidate -ne ${process.pid}) {
    [void]$targetIds.Add($candidate)
  }
}

$targetIds | Sort-Object -Unique
`

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8' },
  )

  if (result.status !== 0 || !result.stdout.trim()) return 0

  let stopped = 0
  for (const line of result.stdout.trim().split(/\r?\n/)) {
    const pid = Number(line.trim())
    if (killTree(pid)) {
      stopped += 1
      log(`Stopped matching Next dev server pid ${pid}.`)
    }
  }

  return stopped
}

const stopped = stopPidFileTarget() + stopWindowsFallbackTargets()

if (stopped === 0) {
  log('No tracked WorkProof Next dev server is running.')
}
