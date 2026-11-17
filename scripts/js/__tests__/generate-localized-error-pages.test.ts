// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { applyScriptPolicy } from '../apply-script-policy.mjs'
import { auditBuiltPages } from '../audit-built-pages.mjs'
import { generateLocalizedErrorPages } from '../generate-localized-error-pages.mjs'

const directories: string[] = []
const english = '<!doctype html><html lang="en"><head><title>Not found</title></head><body><main><h1>Not found</h1></main></body></html>'
const spanish = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Página no encontrada</title><meta name="robots" content="noindex, follow"></head><body><main><h1>Página no encontrada</h1><a href="/es/">Volver al inicio</a></main><script>window.recoveryReady = true</script></body></html>'

const createBuild = async () => {
  const root = await mkdtemp(join(tmpdir(), 'website-localized-errors-'))

  directories.push(root)
  await mkdir(join(root, 'dist/es/404'), { recursive: true })
  await writeFile(join(root, 'dist/404.html'), english)
  await writeFile(join(root, 'dist/es/404/index.html'), spanish)

  return root
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('localized recovery pages', () => {
  test('emits the Spanish host fallback while preserving the direct route and English fallback', async () => {
    const root = await createBuild()

    expect(await generateLocalizedErrorPages(root)).toBe('es/404.html')
    expect(await readFile(join(root, 'dist/es/404.html'), 'utf8')).toBe(spanish)
    expect(await readFile(join(root, 'dist/es/404/index.html'), 'utf8')).toBe(spanish)
    expect(await readFile(join(root, 'dist/404.html'), 'utf8')).toBe(english)
  })

  test('fails clearly when the localized route is missing and preserves any existing fallback', async () => {
    const root = await createBuild()

    await generateLocalizedErrorPages(root)
    await rm(join(root, 'dist/es/404/index.html'))
    await expect(generateLocalizedErrorPages(root)).rejects.toThrow('Could not create dist/es/404.html from the localized recovery page dist/es/404/index.html.')
    expect(await readFile(join(root, 'dist/es/404.html'), 'utf8')).toBe(spanish)
  })

  test('includes the copied document in the shared script policy and built-page validation', async () => {
    const root = await createBuild()

    await writeFile(join(root, 'dist/_headers'), await readFile('public/_headers'))
    await writeFile(join(root, 'dist/es/index.html'), spanish.replace('<title>Página no encontrada</title>', '<title>Inicio</title>'))
    await generateLocalizedErrorPages(root)

    const { policy } = await applyScriptPolicy(root)
    const fallback = await readFile(join(root, 'dist/es/404.html'), 'utf8')

    expect(fallback).toContain(`<meta http-equiv="Content-Security-Policy" content="${policy}">`)
    expect(fallback).toBe(await readFile(join(root, 'dist/es/404/index.html'), 'utf8'))
    expect((await auditBuiltPages(join(root, 'dist'))).issues).toEqual([])
  })
})
