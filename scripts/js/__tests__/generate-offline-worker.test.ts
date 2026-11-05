// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { generateOfflineWorker } from '../generate-offline-worker.mjs'

const directories: string[] = []

const createBuild = async () => {
  const root = await mkdtemp(join(tmpdir(), 'website-offline-'))

  directories.push(root)

  for (const directory of ['public', 'dist/_astro/nested', 'dist/offline', 'dist/es/offline', 'dist/v1/_astro']) {
    await mkdir(join(root, directory), { recursive: true })
  }

  await writeFile(join(root, 'public/sw.js'), await readFile('public/sw.js'))

  for (const [file, content] of [
    ['index.html', '<h1>Home</h1>'],
    ['es/index.html', '<h1>Inicio</h1>'],
    ['offline/index.html', '<h1>Offline</h1>'],
    ['es/offline/index.html', '<h1>Sin conexión</h1>'],
    ['_astro/main.js', 'import("./nested/controls.js")'],
    ['_astro/nested/controls.js', 'console.log("ready")'],
    ['_astro/phone-input.abc123.js', 'unused phone input'],
    ['_astro/phone-formatting.def456.js', 'unused phone formatting'],
    ['_astro/base.css', 'body{font-family:site}'],
    ['_astro/font.woff2', 'font'],
    ['_astro/cover.avif', 'image'],
    ['_astro/main.js.map', 'source map'],
    ['v1/_astro/archive.js', 'archive']
  ] as const) {
    await writeFile(join(root, 'dist', file), content)
  }

  return root
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('offline worker build', () => {
  test('includes code, nested chunks, styles and fonts while excluding images, unused phone chunks and archives', async () => {
    const root = await createBuild()
    const result = await generateOfflineWorker(root)

    expect(result.assets).toEqual([
      '/_astro/base.css', '/_astro/font.woff2', '/_astro/main.js', '/_astro/nested/controls.js'
    ])
    expect(await readFile(join(root, 'dist/sw.js'), 'utf8')).toContain(`const BUILD_REVISION = '${result.revision}'`)
    expect(await generateOfflineWorker(root)).toEqual(result)
  })

  test.each(['index.html', 'es/index.html', 'offline/index.html', 'es/offline/index.html', '_astro/base.css', '_astro/nested/controls.js'])(
    'changes the worker revision when %s changes without a filename change', async file => {
      const root = await createBuild()
      const original = await generateOfflineWorker(root)

      await writeFile(join(root, 'dist', file), 'updated content')

      const updated = await generateOfflineWorker(root)

      expect(updated.assets).toEqual(original.assets)
      expect(updated.revision).not.toBe(original.revision)
    }
  )

  test('rejects missing shell documents and leaves the previous generated worker intact', async () => {
    const root = await createBuild()

    await generateOfflineWorker(root)

    const original = await readFile(join(root, 'dist/sw.js'), 'utf8')

    await rm(join(root, 'dist/offline/index.html'))
    await expect(generateOfflineWorker(root)).rejects.toThrow('ENOENT')
    expect(await readFile(join(root, 'dist/sw.js'), 'utf8')).toBe(original)
  })

  test('rejects an incomplete template instead of emitting a worker without its assets', async () => {
    const root = await createBuild()

    await writeFile(join(root, 'public/sw.js'), 'const BUILD_ASSETS = []')
    await expect(generateOfflineWorker(root)).rejects.toThrow('service worker build marker')
  })

  test('rejects a shell too large for the bounded cache', async () => {
    const root = await createBuild()

    await Promise.all(Array.from({ length: 200 }, (_, index) => writeFile(join(root, `dist/_astro/chunk-${index}.js`), 'export {}')))
    await expect(generateOfflineWorker(root)).rejects.toThrow('1–200 offline code/font assets')
  })
})
