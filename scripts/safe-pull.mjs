import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stopScript = path.join(repoRoot, 'scripts', 'stop-dev.mjs')

const stop = spawnSync(process.execPath, [stopScript], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (stop.status !== 0) {
  process.exit(stop.status ?? 1)
}

const pullArgs = process.argv.slice(2)
const git = spawnSync('git', ['pull', ...pullArgs], {
  cwd: repoRoot,
  stdio: 'inherit',
})

process.exit(git.status ?? 1)
