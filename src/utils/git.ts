import { execFileSync } from 'node:child_process'

const runGit = (arguments_: string[]) => execFileSync('git', arguments_, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore']
}).trim()

/**
 * Returns the latest committed change date for the supplied paths.
 * Builds without Git metadata use the caller-provided stable fallback.
 */
export const getGitLastModified = (paths: string[], fallback: string) => {
  try {
    const value = runGit(['log', '-1', '--format=%cI', '--', ...paths])
    const date = new Date(value)

    return value && !Number.isNaN(date.getTime()) ? date.toISOString() : fallback
  } catch {
    return fallback
  }
}
