// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from 'vitest'

import { gitEnvironment } from '../ci-scope.mjs'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const require = createRequire(import.meta.url)
const turbo = join(dirname(require.resolve('turbo/package.json')), 'bin/turbo')

const hashes = (value: unknown): Map<string, string> => {
  if (!value || typeof value !== 'object' || !('tasks' in value) || !Array.isArray(value.tasks)) throw new Error('Missing Turbo tasks')

  return new Map(value.tasks.map((task: unknown) => {
    if (!task || typeof task !== 'object' || !('taskId' in task) || typeof task.taskId !== 'string' || !('hash' in task) || typeof task.hash !== 'string') throw new Error('Invalid Turbo task')

    return [task.taskId, task.hash]
  }))
}

test('resolved runtime changes invalidate actual static Turbo task hashes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'website-task-runtime-'))
  const env = gitEnvironment(process.env)

  try {
    // Manifests resolve the real workspace dependency graph without copying built artifacts.
    const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, env, encoding: 'utf8' }).split('\0')
      .filter(file => file === 'package.json' || file.endsWith('/package.json') || ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'turbo.json', '.nvmrc'].includes(file))

    for (const file of files) {
      mkdirSync(dirname(join(directory, file)), { recursive: true })
      copyFileSync(join(root, file), join(directory, file))
    }
    symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'), 'junction')
    execFileSync('git', ['init', '-q'], { cwd: directory, env })

    const taskHashes = (runtime: string) => hashes(JSON.parse(execFileSync(process.execPath, [turbo, 'run', 'lint', 'check', '--filter=./apps/*', '--dry=json'], {
      cwd: directory, env: { ...env, QUALITY_TASK_RUNTIME: runtime }, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024
    })))
    const baseline = taskHashes('v24.13.0-11.25.0-linux/x64')

    expect(baseline.size).toBeGreaterThan(0)
    expect(taskHashes('v24.13.0-11.25.0-linux/x64')).toEqual(baseline)
    for (const runtime of ['v24.13.1-11.25.0-linux/x64', 'v24.13.0-11.25.1-linux/x64', 'v24.13.0-11.25.0-darwin/arm64', '']) {
      const changed = taskHashes(runtime)

      expect([...changed.keys()]).toEqual([...baseline.keys()])
      for (const [task, hash] of baseline) expect({ task, hash: changed.get(task) }).not.toEqual({ task, hash })
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 30_000)

test('every persisted task-cache job exports the actual runtime before checks or builds', () => {
  const directory = mkdtempSync(join(tmpdir(), 'website-runtime-export-'))

  try {
    for (const [workflow, job, consumer] of [
      ['build.yml', 'static', 'Run static checks and unit tests'],
      ['build.yml', 'build', 'Build production site'],
      ['e2e-matrix.yml', 'build', '- name: Build\n']
    ] as const) {
      const source = readFileSync(join(root, '.github/workflows', workflow), 'utf8')
      const section = source.split(`\n  ${job}:\n`)[1]?.split(/\n {2}[a-z][\w-]*:\n/u)[0]

      expect(section).toBeDefined()
      const step = section?.split('      - name: Bind task cache to the resolved runtime\n')[1]?.split('\n      - name:')[0]
      const script = step?.split('        run: |\n')[1]?.replace(/^ {10}/gmu, '').trim()

      if (!script || !section) throw new Error(`Missing runtime export in ${workflow}:${job}`)
      expect(section.indexOf('Bind task cache')).toBeGreaterThan(section.indexOf('Set up pnpm workspace'))

      expect(section.indexOf('Bind task cache')).toBeLessThan(section.indexOf(consumer))
      const output = join(directory, `${workflow}-${job}`)

      execFileSync('bash', ['-e', '-c', script], { env: { ...process.env, GITHUB_ENV: output } })
      const pnpm = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim()

      expect(readFileSync(output, 'utf8').trim()).toBe(`QUALITY_TASK_RUNTIME=${process.version}-${pnpm}-${process.platform}/${process.arch}`)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 30_000)
