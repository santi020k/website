import { spawn } from 'node:child_process'
import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

// Evaluate packed release candidates without committing local paths or an unpublished lockfile.
const [directory, ...command] = process.argv.slice(2)

if (!directory) {
  throw new Error('Usage: pnpm run preview:lumen:v4 <tarball directory> [command ...arguments]')
}

const packages = ['lumen-astro', 'lumen-core', 'lumen']
const overrides = []

for (const name of packages) {
  const tarball = resolvePath(directory, `santi020k-${name}-4.0.0.tgz`)

  await access(tarball)

  overrides.push(`  "@santi020k/${name}": ${JSON.stringify(`file:${tarball}`)}`)
}

const workspacePath = new URL('../../pnpm-workspace.yaml', import.meta.url)
const lockPath = new URL('../../pnpm-lock.yaml', import.meta.url)
const workspace = await readFile(workspacePath, 'utf8')
const lock = await readFile(lockPath, 'utf8')

if (!workspace.includes('\noverrides:\n')) {
  throw new Error('Expected the website workspace overrides section')
}

/**
 * @param {string} executable
 * @param {string[]} args
 * @returns {Promise<void>}
 */
const run = (executable, args) => new Promise((resolve, reject) => {
  const child = spawn(executable, args, {
    cwd: new URL('../../', import.meta.url),
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' },
    stdio: 'inherit'
  })

  const interrupt = () => child.kill('SIGINT')
  const terminate = () => child.kill('SIGTERM')

  const cleanup = () => {
    process.off('SIGINT', interrupt)

    process.off('SIGTERM', terminate)
  }

  process.on('SIGINT', interrupt)

  process.on('SIGTERM', terminate)

  child.once('error', error => {
    cleanup()

    reject(error)
  })

  child.once('exit', (code, signal) => {
    cleanup()

    if (code !== 0) {
      reject(new Error(`${executable} ${args.join(' ')} failed (${signal ?? code})`))

      return
    }

    resolve()
  })
})

try {
  await writeFile(workspacePath, workspace.replace('\noverrides:\n', `\noverrides:\n${overrides.join('\n')}\n`))

  await run('pnpm', ['install', '--no-frozen-lockfile'])

  const [executable = 'pnpm', ...args] = command.length ? command : ['pnpm', 'run', 'dev']

  await run(executable, args)
} finally {
  await writeFile(workspacePath, workspace)

  await writeFile(lockPath, lock)

  await run('pnpm', ['install', '--frozen-lockfile'])
}

console.log('Lumen 4 candidate session finished; published dependencies restored.')
