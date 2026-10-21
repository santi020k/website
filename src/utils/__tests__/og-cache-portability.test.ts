import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { generate, type OgConfig, type OgRenderer } from '@santi020k/og'
import { afterEach, describe, expect, test, vi } from 'vitest'

const directories: string[] = []

const createCheckout = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'website-og-cache-'))

  directories.push(root)

  return root
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(root => rm(root, { force: true, recursive: true })))
})

describe('installed OG cache portability', () => {
  test('reuses images and public versions after moving a checkout, then detects changed inputs', async () => {
    const original = await createCheckout()
    const moved = await createCheckout()
    const renderer = vi.fn<OgRenderer<{ title: string }>>(data => `<svg>${data.title}</svg>`)

    await writeFile(path.join(original, 'cover.svg'), '<svg>Cover</svg>')
    await writeFile(path.join(original, 'post.md'), 'Original post')

    const config = (root: string): OgConfig<{ title: string }> => ({
      assets: [{ output: 'cover.svg', source: path.join(root, 'cover.svg') }],
      cards: [{
        aliases: ['alias.svg'],
        data: { title: 'Portable social card' },
        output: 'post.svg',
        route: { pathname: '/post/' },
        sources: [path.join(root, 'post.md')]
      }],
      renderer,
      root,
      routeManifest: { cacheBust: true }
    })

    await generate(config(original))
    await cp(original, moved, { recursive: true })

    const cache = await readFile(path.join(moved, '.og-cache.json'), 'utf8')
    const manifest = await readFile(path.join(moved, 'public/og/manifest.json'), 'utf8')

    expect((await generate(config(moved), { check: true })).stale).toEqual([])
    expect((await generate(config(moved))).generated).toEqual([])
    expect(renderer).toHaveBeenCalledOnce()
    expect(await readFile(path.join(moved, '.og-cache.json'), 'utf8')).toBe(cache)
    expect(await readFile(path.join(moved, 'public/og/manifest.json'), 'utf8')).toBe(manifest)

    await writeFile(path.join(moved, 'post.md'), 'Updated post')

    expect((await generate(config(moved))).generated).toEqual(['post.svg', 'alias.svg'])
    expect(await readFile(path.join(moved, 'public/og/manifest.json'), 'utf8')).not.toBe(manifest)

    await writeFile(path.join(moved, 'cover.svg'), '<svg>New cover</svg>')

    expect((await generate(config(moved))).generated).toEqual(['cover.svg'])

    await writeFile(path.join(moved, 'public/og/post.svg'), 'Corrupt output')

    expect((await generate(config(moved), { check: true })).stale).toEqual(['post.svg'])
  })
})
