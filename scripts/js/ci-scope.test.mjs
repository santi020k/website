import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { classifyPaths, gitEnvironment, planScope, validationSteps } from './ci-scope.mjs'

test('only proven isolated paths select fewer checks', () => {
  assert.equal(classifyPaths(['src/pages/index.astro']).mode, 'current')

  for (const paths of [[], ['pnpm-lock.yaml'], ['unknown.ts'], ...['apps/v3/src/page.astro', 'packages/website-history/map.json', 'public/logo.svg'].map(path => [path])]) assert.equal(classifyPaths(paths).mode, 'full')
})

test('canonical checks added later force complete validation', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

  assert.notDeepEqual(validationSteps(scripts), [['run', 'verify:quality']])

  for (const key of ['verify:quality', 'lint', 'check']) assert.deepEqual(validationSteps({ ...scripts, [key]: scripts[key] + ' && pnpm extra' }), [['run', 'verify:quality']])
})

test('release, push, manual and missing history always select full validation', () => {
  for (const env of [{ GITHUB_HEAD_REF: 'release/v0.4.0' }, { GITHUB_EVENT_NAME: 'push' }, { GITHUB_EVENT_NAME: 'workflow_dispatch' }]) {
    assert.equal(planScope({ base: 'HEAD', env }).mode, 'full')
  }

  assert.equal(planScope().mode, 'full')

  assert.equal(planScope({ base: '--output=/tmp/untrusted' }).mode, 'full')

  assert.deepEqual(gitEnvironment({ PATH: '/bin', GIT_DIR: '/tmp/foreign', GIT_INDEX_FILE: '/tmp/foreign-index' }), { PATH: '/bin' })
})

test('real Git comparison includes rename sources, local files and merge-base history', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'website-ci-test-'))
  const env = { ...gitEnvironment(process.env), GITHUB_EVENT_NAME: 'pull_request', GITHUB_HEAD_REF: 'ci/fixture' }
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

  try {
    git('init', '-q', '-b', 'main')

    git('config', 'user.name', 'CI fixture')

    git('config', 'user.email', 'ci@example.test')

    mkdirSync(join(cwd, 'src/pages'), { recursive: true })

    writeFileSync(join(cwd, 'src/pages/index.astro'), 'initial')

    writeFileSync(join(cwd, 'shared.txt'), 'shared')

    git('add', '.')

    git('commit', '-qm', 'fixture')

    const base = git('rev-parse', 'HEAD')

    writeFileSync(join(cwd, 'src/pages/index.astro'), 'updated')

    assert.equal(planScope({ cwd, base, env }).mode, 'current')

    writeFileSync(join(cwd, 'unknown.txt'), 'untracked')

    assert.equal(planScope({ cwd, base, env }).mode, 'full')

    rmSync(join(cwd, 'unknown.txt'))

    git('mv', 'shared.txt', 'src/pages/renamed.md')

    assert.equal(planScope({ cwd, base, env: { ...env, GIT_DIR: '/tmp/foreign' } }).mode, 'full')

    git('add', '.')

    git('commit', '-qm', 'rename')

    assert.equal(planScope({ cwd, base, head: git('rev-parse', 'HEAD'), env }).mode, 'full')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('current-site selection generates Astro types before strict lint', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  const steps = validationSteps(scripts)
  const sync = steps.findIndex(args => args.join(' ') === 'exec astro sync')
  const lint = steps.findIndex(args => args.join(' ') === 'run lint:current')

  assert.ok(sync >= 0 && sync < lint)
})
