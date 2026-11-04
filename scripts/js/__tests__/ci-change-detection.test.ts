// @vitest-environment node
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { load } from 'js-yaml'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

interface Step {
  id?: unknown
  run?: unknown
  env?: unknown
}

const execFileAsync = promisify(execFile)
const workflowPath = path.resolve(import.meta.dirname, '../../../.github/workflows/build.yml')

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

// Git hooks export repository variables such as GIT_DIR and GIT_INDEX_FILE, which
// would redirect fixture commands to the pushing checkout. Drop every inherited
// GIT_* key, keep PATH and the rest, and ignore global and system Git configuration.
const isolatedEnvironment = (
  inherited: NodeJS.ProcessEnv,
  variables: Record<string, string> = {}
): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(Object.entries(inherited).filter(([key]) => !key.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  ...variables
})

const fixtureIdentity = {
  GIT_AUTHOR_EMAIL: 'ci@example.com',
  GIT_AUTHOR_NAME: 'CI fixture',
  GIT_COMMITTER_EMAIL: 'ci@example.com',
  GIT_COMMITTER_NAME: 'CI fixture'
}

const runGit = async (cwd: string, args: string[], inherited: NodeJS.ProcessEnv = process.env) => (
  await execFileAsync('git', args, { cwd, env: isolatedEnvironment(inherited, fixtureIdentity) })
).stdout.trim()

// Executes the workflow's own classifier, so a pattern change is tested as GitHub runs it.
const loadDetectionScript = async () => {
  const workflow = load(await readFile(workflowPath, 'utf8'))
  const jobs = isRecord(workflow) ? workflow.jobs : undefined
  // The static job classifies changes; browser shards and the quality gate consume its outputs.
  const staticChecks = isRecord(jobs) ? jobs.static : undefined
  const steps: unknown[] = isRecord(staticChecks) && Array.isArray(staticChecks.steps) ? staticChecks.steps : []
  const step = steps.find((candidate): candidate is Step => isRecord(candidate) && candidate.id === 'changes')

  if (step?.run !== 'node scripts/js/ci-scope.mjs' || !isRecord(step.env) ||
    step.env.CI_BASE_SHA !== '${{ github.event.pull_request.base.sha }}' ||
    step.env.CI_HEAD_SHA !== '${{ github.event.pull_request.head.sha }}')
    throw new TypeError('Expected the Node change-detection step and pull request revisions')

  return path.resolve(import.meta.dirname, '../ci-scope.mjs')
}

describe('CI change detection', () => {
  let directory = ''
  let script = ''
  let baseSha = ''

  const git = (...args: string[]) => runGit(directory, args)

  const classify = async (eventName: string, headSha = '', inherited: NodeJS.ProcessEnv = process.env) => {
    const runnerTemp = await mkdtemp(path.join(tmpdir(), 'website-ci-runner-'))
    const output = path.join(runnerTemp, 'output')

    try {
      await writeFile(output, '')

      // Execute the same Node classifier selected by the workflow.
      await execFileAsync(process.execPath, [script], {
        cwd: directory,
        env: isolatedEnvironment(inherited, {
          CI_BASE_SHA: baseSha,
          CI_HEAD_SHA: headSha,
          GITHUB_EVENT_NAME: eventName,
          GITHUB_HEAD_REF: 'ci/fixture',
          GITHUB_OUTPUT: output,
          RUNNER_TEMP: runnerTemp
        })
      })

      const result: Record<string, string> = {}

      for (const line of (await readFile(output, 'utf8')).trim().split('\n')) {
        const [key = '', value = ''] = line.split('=')

        result[key] = value
      }

      return result
    } finally {
      await rm(runnerTemp, { recursive: true, force: true })
    }
  }

  const commitChange = async (file: string, remove = false, inherited: NodeJS.ProcessEnv = process.env) => {
    const commit = (...args: string[]) => runGit(directory, args, inherited)

    await commit('checkout', '--quiet', '--detach', baseSha)

    if (remove) {
      await commit('rm', '--quiet', file)
    } else {
      await mkdir(path.dirname(path.join(directory, file)), { recursive: true })
      await writeFile(path.join(directory, file), `changed ${file}\n`)
      await commit('add', '--', file)
    }

    await commit('commit', '--quiet', '-m', `change ${file}`)

    return commit('rev-parse', 'HEAD')
  }

  beforeAll(async () => {
    script = await loadDetectionScript()
    directory = await mkdtemp(path.join(tmpdir(), 'website-ci-changes-'))

    await git('init', '--quiet')

    for (const file of ['og.audit.config.mjs', '.og-cache.json', 'README.md']) {
      await writeFile(path.join(directory, file), `base ${file}\n`)
    }

    await git('add', '.')
    await git('commit', '--quiet', '-m', 'base')
    baseSha = await git('rev-parse', 'HEAD')
  })

  afterAll(async () => {
    if (directory) await rm(directory, { recursive: true, force: true })
  })

  test.each([
    ['og.audit.config.mjs', false, { mode: 'full', checks: 'true', full: 'true' }],
    ['og.audit.config.mjs', true, { mode: 'full', checks: 'true', full: 'true' }],
    ['.og-cache.json', false, { mode: 'full', checks: 'true', full: 'true' }],
    ['src/pages/index.astro', false, { mode: 'current', checks: 'true', full: 'true' }],
    ['tests/seo.spec.ts', false, { mode: 'current', checks: 'true', full: 'true' }],
    ['.changeset/v5-release.md', false, { mode: 'current', checks: 'true', full: 'true' }],
    ['apps/v1/src/pages/index.astro', false, { mode: 'full', checks: 'true', full: 'true' }],
    ['astro.config.ts', false, { mode: 'full', checks: 'true', full: 'true' }],
    ['.github/workflows/build.yml', false, { mode: 'full', checks: 'true', full: 'true' }],
    ['docs/deployment.md', false, { mode: 'docs', checks: 'true', full: 'false' }],
    ['README.md', true, { mode: 'docs', checks: 'true', full: 'false' }],
    ['.vscode/settings.json', false, { mode: 'full', checks: 'true', full: 'true' }],
    // Git quotes these paths in line output, so they must be read NUL-delimited.
    ['src/content/post/café/index.md', false, { mode: 'current', checks: 'true', full: 'true' }],
    ['docs/café.md', false, { mode: 'docs', checks: 'true', full: 'false' }],
    ['docs/line\nbreak.md', false, { mode: 'docs', checks: 'true', full: 'false' }],
    ['src/line\nbreak.ts', false, { mode: 'current', checks: 'true', full: 'true' }]
  ])('classifies a pull request changing %j (removed: %s)', async (file, remove, expected) => {
    expect(await classify('pull_request', await commitChange(file, remove))).toEqual(expected)
  })

  test('runs every check for a manual dispatch without diffing', async () => {
    expect(await classify('workflow_dispatch')).toEqual({ mode: 'full', checks: 'true', full: 'true' })
  })

  // A disposable decoy stands in for the checkout a pre-push hook would expose.
  test('ignores repository variables inherited from a Git hook', async () => {
    const decoy = await mkdtemp(path.join(tmpdir(), 'website-ci-hook-'))

    try {
      await runGit(decoy, ['init', '--quiet'])
      await writeFile(path.join(decoy, 'tracked.txt'), 'decoy\n')
      await runGit(decoy, ['add', '--', 'tracked.txt'])
      await runGit(decoy, ['commit', '--quiet', '-m', 'decoy'])

      const gitDirectory = path.join(decoy, '.git')

      const hook = {
        ...process.env,
        GIT_COMMON_DIR: gitDirectory,
        GIT_DIR: gitDirectory,
        GIT_INDEX_FILE: path.join(gitDirectory, 'index'),
        GIT_WORK_TREE: decoy
      }

      // Read-only views; a redirected commit, checkout, or staging would change one.
      const snapshot = async () => ({
        branch: await runGit(decoy, ['symbolic-ref', 'HEAD']),
        commits: await runGit(decoy, ['rev-list', '--all']),
        index: await runGit(decoy, ['ls-files', '--stage']),
        status: await runGit(decoy, ['--no-optional-locks', 'status', '--porcelain'])
      })

      const before = await snapshot()
      const headSha = await commitChange('og.audit.config.mjs', false, hook)

      expect(await classify('pull_request', headSha, hook)).toEqual({ mode: 'full', checks: 'true', full: 'true' })
      expect(await git('rev-parse', 'HEAD')).toBe(headSha)
      expect(await snapshot()).toEqual(before)
    } finally {
      await rm(decoy, { recursive: true, force: true })
    }
  }, 15_000)
})
