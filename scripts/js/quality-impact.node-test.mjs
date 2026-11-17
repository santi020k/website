import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { gitEnvironment } from './ci-scope.mjs'

// Run with the pinned Quality CLI on PATH; CI installs it before this suite.
test('committed impact graph preserves fallback, dependencies and fresh security checks', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'website-impact-'))
  const env = gitEnvironment(process.env)
  /** @param {string[]} args */
  const git = args => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: 'pipe' }).trim()

  /** @param {string} path @param {string} value */
  const write = (path, value) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true })

    writeFileSync(join(cwd, path), value)
  }

  /** @param {string} base */
  const plan = base => JSON.parse(execFileSync('quality', ['impact', 'plan', '--base', base, '--head', 'HEAD', '--format', 'json'], { cwd, env, encoding: 'utf8' }))
  /** @param {{ selected: { id: string }[] }} result */
  const ids = result => result.selected.map(node => node.id).sort()

  try {
    git(['init', '-q', '-b', 'main'])

    git(['config', 'user.name', 'Fixture'])

    git(['config', 'user.email', 'fixture@example.test'])

    const policy = JSON.parse(readFileSync(new URL('../../quality-impact.json', import.meta.url), 'utf8'))

    write('quality-impact.json', JSON.stringify(policy))

    write('src/component.astro', 'initial')

    write('docs/example.md', 'initial')

    write('pnpm-lock.yaml', 'initial')

    git(['add', '.'])

    git(['commit', '-qm', 'initial'])

    const base = git(['rev-parse', 'HEAD'])

    write('docs/example.md', 'documentation')

    git(['add', '.'])

    git(['commit', '-qm', 'documentation'])

    assert.deepEqual(ids(plan(base)), ['documentation', 'security'])

    write('src/component.astro', 'updated')

    git(['add', '.'])

    git(['commit', '-qm', 'component'])

    const selected = ids(plan(base))

    for (const node of ['current', 'production-build', 'browser', 'security']) assert.ok(selected.includes(node))

    const beforeRename = git(['rev-parse', 'HEAD'])

    git(['mv', 'src/component.astro', 'docs/moved.md'])

    git(['commit', '-qm', 'rename'])

    assert.ok(ids(plan(beforeRename)).includes('browser'))

    const beforeDelete = git(['rev-parse', 'HEAD'])

    git(['rm', 'docs/example.md'])

    git(['commit', '-qm', 'delete'])

    assert.deepEqual(ids(plan(beforeDelete)), ['documentation', 'security'])

    for (const path of ['pnpm-lock.yaml', 'unknown.txt']) {
      const previous = git(['rev-parse', 'HEAD'])

      write(path, 'changed')

      git(['add', '.'])

      git(['commit', '-qm', 'fallback'])

      assert.deepEqual(ids(plan(previous)), Object.keys(policy.nodes).sort())
    }

    assert.deepEqual(ids(plan('missing-baseline')), Object.keys(policy.nodes).sort())
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
