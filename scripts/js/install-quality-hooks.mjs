import { execFileSync } from 'node:child_process'

const legacyHuskyHooksPath = '.husky/_'
const qualityVersion = 'v0.3.1'

if (process.env.CI) {
  process.exit(0)
}

const hasQualityCli = () => {
  try {
    execFileSync('quality', ['--version'], { stdio: 'ignore' })

    return true
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return false
    }

    throw error
  }
}

if (!hasQualityCli()) {
  process.stderr.write(
    [
      `[hooks] Quality CLI ${qualityVersion} is required to install repository hooks.`,
      `Install it with: curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/santi020k/quality/main/install.sh | sh -s -- santi020k/quality ${qualityVersion}`,
      'Then run: pnpm run hooks:install',
      ''
    ].join('\n')
  )

  process.exit(0)
}

const getHooksPath = () => {
  try {
    return execFileSync('git', ['config', '--local', '--get', 'core.hooksPath'], {
      encoding: 'utf8'
    }).trim()
  } catch {
    return ''
  }
}

if (getHooksPath() === legacyHuskyHooksPath) {
  execFileSync('git', ['config', '--local', '--unset', 'core.hooksPath'])
}

execFileSync('quality', ['hooks', 'install'], { stdio: 'inherit' })
