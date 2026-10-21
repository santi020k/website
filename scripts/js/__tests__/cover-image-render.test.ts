import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

import sharp from 'sharp'
import { expect, test } from 'vitest'

test('cover images support responsive WebP fallbacks without changing the default output', async () => {
  const root = mkdtempSync(join(tmpdir(), 'website-cover-render-'))
  const projectRoot = process.cwd()

  try {
    symlinkSync(join(projectRoot, 'node_modules'), join(root, 'node_modules'), 'dir')
    mkdirSync(join(root, 'src/pages'), { recursive: true })
    await sharp({ create: { width: 1280, height: 800, channels: 3, background: '#663399' } })
      .png().toFile(join(root, 'src/cover.png'))
    writeFileSync(join(root, 'src/pages/index.astro'), [
      '---',
      'import CoverImage from \'@santi020k/lumen-astro/components/CoverImage\'',
      'import cover from \'../cover.png\'',
      '---',
      '<html lang="en"><head><title>Cover fixture</title></head><body>',
      '<CoverImage id="modern" alt="Modern cover" image={cover} fallbackFormat="webp" />',
      '<CoverImage id="default" alt="Default cover" image={cover} />',
      '</body></html>'
    ].join('\n'))

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
      `import { build } from 'astro'; globalThis.fetch = () => Promise.reject(new Error('Unexpected build-time fetch')); await build(${JSON.stringify(configuration)});`
    ], { cwd: projectRoot, encoding: 'utf8', timeout: 30_000 })

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)

    const document = new DOMParser().parseFromString(readFileSync(join(root, 'dist/index.html'), 'utf8'), 'text/html')
    const modern = document.querySelector('#modern')
    const original = document.querySelector('#default')

    expect(modern).not.toBeNull()
    expect(original).not.toBeNull()
    expect(modern?.hasAttribute('fallbackFormat')).toBe(false)
    expect(modern?.querySelectorAll('source')).toHaveLength(1)
    expect(modern?.querySelector('source')?.getAttribute('type')).toBe('image/avif')
    expect(original?.querySelectorAll('source')).toHaveLength(2)

    for (const [element, format] of [[modern, 'webp'], [original, 'png']] as const) {
      const image = element?.querySelector('img')
      const src = image?.getAttribute('src') ?? ''

      expect(src).toMatch(new RegExp(`\\.${format}$`, 'u'))
      expect(image?.getAttribute('srcset')).toContain(`.${format} 320w`)
      expect(image?.getAttribute('sizes')).toBe('(min-width: 1024px) 800px, 100vw')
      const bytes = readFileSync(join(root, 'dist', src))

      expect(bytes.subarray(format === 'webp' ? 8 : 1, format === 'webp' ? 12 : 4).toString()).toBe(format === 'webp' ? 'WEBP' : 'PNG')
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 35_000)
