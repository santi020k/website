import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { expect, test } from 'vitest'

import { ogManifest } from '../../../src/data/og-manifest'

test('technology pages resolve artwork by canonical route across label variants and pagination', () => {
  const projectRoot = process.cwd()

  mkdirSync(join(projectRoot, '.cache'), { recursive: true })
  // A sibling fixture keeps Astro's module identities consistent while isolating generated types.
  const root = mkdtempSync(join(projectRoot, '.cache/technology-og-'))
  const prefixes = ['', 'es/'] as const

  try {
    for (const prefix of prefixes) {
      for (const pageNumber of [1, 2]) {
        const directory = join(root, `src/pages/${prefix}technologies/typescript`, pageNumber === 1 ? '' : '2')

        mkdirSync(directory, { recursive: true })
        writeFileSync(join(directory, 'index.astro'), [
          '---',
          `import TechnologyPage from ${JSON.stringify(join(projectRoot, 'src/pages/technologies/[technology]/[...page].astro'))}`,
          // Two pages imply more entries than the indexing threshold, so the archive keeps its own card.
          `const page = { data: [], start: 0, end: 0, size: 50, total: 60, currentPage: ${pageNumber}, lastPage: 2, url: { current: '/${prefix}technologies/typescript/${pageNumber === 1 ? '' : '2/'}' } }`,
          '---',
          '<TechnologyPage page={page} technology="Typescript" />'
        ].join('\n'))
      }
    }

    const configuration = {
      root,
      srcDir: join(root, 'src'),
      outDir: join(root, 'dist'),
      publicDir: join(root, 'public'),
      cacheDir: join(root, 'cache'),
      configFile: relative(root, join(projectRoot, 'astro.config.ts')),
      logLevel: 'silent',
      vite: { cacheDir: join(root, 'vite-cache'), resolve: { alias: { '@': join(projectRoot, 'src') } } }
    }
    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '-e',
      'import { build } from "astro"; globalThis.fetch = () => Promise.reject(new Error("Unexpected build-time fetch")); await build(JSON.parse(process.env.ASTRO_FIXTURE_CONFIG));'
    ], { cwd: root, encoding: 'utf8', env: { ...process.env, ASTRO_FIXTURE_CONFIG: JSON.stringify(configuration) }, timeout: 60_000 })

    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })

    for (const prefix of prefixes) {
      const primary = ogManifest.routes[`/${prefix}technologies/typescript/`]?.images.find(image => image.primary)

      expect(primary?.url).toBeTruthy()

      for (const pageNumber of [1, 2]) {
        const html = readFileSync(join(root, `dist/${prefix}technologies/typescript`, pageNumber === 1 ? '' : '2', 'index.html'), 'utf8')
        const document = new DOMParser().parseFromString(html, 'text/html')
        const expected = new URL(primary?.url ?? '', 'https://santi020k.com').href

        expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(expected)
        expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(expected)
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 65_000)
