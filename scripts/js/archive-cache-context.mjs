import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'

/** @param {NodeJS.ProcessEnv} environment */
export const archiveEnvironment = environment => Object.fromEntries(Object.entries(environment).filter(([key]) => !key.startsWith('GIT_')))

/**
 * Archive project durations depend on the calendar day, not the build's wall-clock time.
 * Pin that day for the entire build, including builds that cross midnight.
 * @param {{ now: Date, runtime: string, timezone: string, history: string }} input
 */
export const archiveIdentity = ({ now, runtime, timezone, history }) => {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).toISOString()
  const identity = createHash('sha256').update(JSON.stringify({ schema: 1, date, runtime, timezone, history })).digest('hex')

  return { date, identity }
}

/** @param {{ cwd?: string, now?: Date, environment?: NodeJS.ProcessEnv }} [options] */
export const archiveCacheContext = ({ cwd = process.cwd(), now = new Date(), environment = process.env } = {}) => {
  const env = archiveEnvironment(environment)
  const runtime = `${process.version}:${process.platform}:${process.arch}`
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  /** @param {string[]} args */
  const git = args => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

  try {
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false') throw new Error('Incomplete Git history')

    // Resume metadata reads commit dates inside these archives. Include history,
    // not only file bytes: an amended commit can change a date without changing its tree.
    const history = git(['log', '--format=%H:%cI', '--', 'apps/v3', 'apps/v4'])

    return { ...archiveIdentity({ now, runtime, timezone, history }), reusable: true }
  } catch {
    // No evidence means no reuse. A unique identity also prevents writing a
    // fallback result under a key later treated as a verified historical build.
    return { ...archiveIdentity({ now, runtime, timezone, history: randomUUID() }), reusable: false }
  }
}
