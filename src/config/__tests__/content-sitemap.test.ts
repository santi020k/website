import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { buildContentSitemapMetadata } from '../content-sitemap'

const site = 'https://example.com'
let root: string

const write = async (relative: string, frontmatter: string) => {
  const file = path.join(root, 'src/content', relative)

  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `---\n${frontmatter}\n---\n\nBody.\n`)
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'content-sitemap-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('buildContentSitemapMetadata', () => {
  test('dates posts, their tag, series and index pages, and skips drafts, future posts and translations', async () => {
    await write('post/2026/first/index.md', 'title: First\npublishDate: 2026-01-10\ntags: [Astro, " CSS "]\nseriesId: notes')
    await write('post/2026/first/index.es.md', 'title: Primero\npublishDate: 2026-05-01')
    await write('post/2026/second/index.md', 'title: Second\npublishDate: 2026-02-01\nupdatedDate: 2026-03-01\ntags: [astro]')
    await write('post/2026/draft/index.md', 'title: Draft\npublishDate: 2026-01-01\ndraft: true')
    await write('post/2027/later/index.md', 'title: Later\npublishDate: 2027-06-01')

    const { lastmodMap } = await buildContentSitemapMetadata({ now: new Date('2026-06-01T00:00:00Z'), root, siteOrigin: site })

    expect(lastmodMap.get(`${site}/blog/first/`)).toMatch(/^2026-01-10/u)
    expect(lastmodMap.get(`${site}/blog/second/`)).toMatch(/^2026-03-01/u)
    expect(lastmodMap.get(`${site}/blog/`)).toMatch(/^2026-03-01/u)
    expect(lastmodMap.get(`${site}/blog/tags/astro/`)).toMatch(/^2026-03-01/u)
    expect(lastmodMap.get(`${site}/blog/tags/css/`)).toMatch(/^2026-01-10/u)
    expect(lastmodMap.get(`${site}/blog/series/notes/`)).toMatch(/^2026-01-10/u)
    expect(lastmodMap.has(`${site}/blog/draft/`)).toBe(false)
    expect(lastmodMap.has(`${site}/blog/later/`)).toBe(false)
  })

  test('lists posts whose canonical URL points elsewhere', async () => {
    await write('post/2025/moved/index.md', 'title: Moved\npublishDate: 2025-01-01\ncanonicalUrl: https://medium.com/moved')
    await write('post/2025/home/index.md', `title: Home\npublishDate: 2025-01-01\ncanonicalUrl: ${site}/blog/home/`)

    const { nonCanonicalPageUrls } = await buildContentSitemapMetadata({ root, siteOrigin: site })

    expect([...nonCanonicalPageUrls]).toEqual([`${site}/blog/moved/`])
  })

  test('dates projects only by updatedDate', async () => {
    await write('project/tool/index.mdx', 'title: Tool\nstartingDate: 2020-01-01\nupdatedDate: 2026-04-02')
    await write('project/old/index.md', 'title: Old\nstartingDate: 2019-01-01')

    const { lastmodMap } = await buildContentSitemapMetadata({ root, siteOrigin: site })

    expect(lastmodMap.get(`${site}/portfolio/tool/`)).toMatch(/^2026-04-02/u)
    expect(lastmodMap.has(`${site}/portfolio/old/`)).toBe(false)
    expect(lastmodMap.get(`${site}/projects/`)).toMatch(/^2026-04-02/u)
  })
})
