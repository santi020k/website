import { execFileSync } from 'node:child_process'

import { archiveCacheContext, archiveEnvironment } from './archive-cache-context.mjs'

const context = archiveCacheContext()

console.log(`Archive task cache: ${context.reusable ? 'verified runtime, calendar day and Git history' : 'disabled because Git history is unavailable or shallow'}`)

execFileSync('pnpm', ['exec',
  'turbo',
  'run',
  'build:site',
  '--concurrency=1',
  ...(context.reusable ? [] : ['--force']),
  ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...archiveEnvironment(process.env),
    WEBSITE_ARCHIVE_BUILD_DATE: context.date,
    WEBSITE_ARCHIVE_CACHE_IDENTITY: context.identity
  }
})
