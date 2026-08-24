import { execFileSync } from 'node:child_process'

const legacyHuskyHooksPath = '.husky/_'

if (process.env.CI) {
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
