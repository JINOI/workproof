import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextBin = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next')
const stateDir = path.join(repoRoot, '.next')
const pidFile = path.join(stateDir, 'workproof-dev.pid')

const rawArgs = process.argv.slice(2)
const useTurbo = rawArgs.includes('--turbo')
const forwardedArgs = rawArgs.filter((arg) => arg !== '--turbo')
const bundlerFlag = useTurbo ? '--turbo' : '--webpack'
const nextArgs = ['dev', bundlerFlag, '--hostname', '0.0.0.0', ...forwardedArgs]

mkdirSync(stateDir, { recursive: true })

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: repoRoot,
  stdio: 'inherit',
})

writeFileSync(
  pidFile,
  JSON.stringify(
    {
      pid: child.pid,
      command: `next ${nextArgs.join(' ')}`,
      startedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
)

let shuttingDown = false

function cleanup() {
  rmSync(pidFile, { force: true })
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  if (child.pid && !child.killed) {
    child.kill(signal)
  }
  setTimeout(() => {
    cleanup()
    process.exit(0)
  }, 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('exit', cleanup)

child.on('error', (error) => {
  cleanup()
  console.error(error.message)
  process.exit(1)
})

child.on('exit', (code) => {
  cleanup()
  process.exit(code ?? 0)
})
