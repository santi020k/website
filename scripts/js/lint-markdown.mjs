import { glob } from 'node:fs/promises'
import { relative, resolve as resolvePath } from 'node:path'
import { pathToFileURL } from 'node:url'

import { lint } from 'markdownlint/promise'

import settings from '../../markdownlint.config.json' with { type: 'json' }

/** @param {string} [cwd] */
export const lintMarkdown = async (cwd = process.cwd()) => {
  /** @type {string[]} */
  const files = []

  for await (const file of glob(settings.globs, { cwd })) {
    files.push(file)
  }

  files.sort()

  if (files.length === 0) {
    throw new Error('No Markdown files matched markdownlint.config.json.')
  }

  const results = await lint({
    files: files.map(file => resolvePath(cwd, file)),
    config: settings.config
  })

  const diagnostics = Object.entries(results).flatMap(([file, errors]) => errors.map(error => {
    const detail = error.errorDetail ? ` [${error.errorDetail}]` : ''

    return `${relative(cwd, file)}:${error.lineNumber} ${error.ruleNames.join('/')} ${error.ruleDescription}${detail}`
  }))

  return { files, diagnostics, errorCount: diagnostics.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolvePath(process.argv[1])).href) {
  try {
    const { files, diagnostics, errorCount } = await lintMarkdown()

    if (errorCount > 0) {
      console.error(diagnostics.join('\n'))
    }

    console.log(`Markdown lint: ${files.length} files, ${errorCount} issues`)

    process.exitCode = errorCount > 0 ? 1 : 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Markdown lint failed.')

    process.exitCode = 1
  }
}
