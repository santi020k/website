import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { planScope, validationSteps } from './ci-scope.mjs'

const plan = planScope({ base: process.env.CI_BASE_SHA, head: process.env.CI_HEAD_SHA || 'HEAD', full: process.argv.includes('--full') })
const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const steps = plan.mode === 'full' ? [['run', 'verify:quality']] : validationSteps(scripts)

console.log(`CI scope: ${plan.mode}; commands: ${steps.map(args => args.join(' ')).join('; ')}`)

for (const args of steps) execFileSync('pnpm', args, { stdio: 'inherit' })
