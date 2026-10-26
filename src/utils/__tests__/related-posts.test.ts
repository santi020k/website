import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

interface MockPost {
  id: string
  data: {
    tags: string[]
    publishDate: Date
    draft: boolean
    seriesId?: string
    canonicalUrl?: string
  }
}

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn<() => Promise<MockPost[]>>()
}))

vi.mock('astro:content', () => ({ getCollection: getCollectionMock }))

const post = (id: string, overrides: Partial<MockPost['data']> = {}): MockPost => ({
  id, data: { tags: ['typescript'], publishDate: new Date('2026-01-01T12:00:00Z'), draft: false, ...overrides }
})

describe('fresh related writing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('PROD', false)
    vi.useFakeTimers({ now: new Date('2026-10-26T12:00:00Z'), toFake: ['Date'] })
    getCollectionMock.mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  test('excludes recommendations before limiting, preserving tag score then date ranking', async () => {
    getCollectionMock.mockResolvedValue([
      post('current'),
      post('same-series', { seriesId: 'current-series' }),
      post('2024/already-recommended/index.md', { tags: ['typescript', 'auth'] }),
      post('newer', { publishDate: new Date('2026-09-01T12:00:00Z') }),
      post('more-related', { tags: ['typescript', 'auth'] }),
      post('older'),
      post('unrelated', { tags: ['travel'] })
    ])
    const { getRelatedPosts } = await import('../content')
    const options = { currentPostId: 'current', excludeSeriesId: 'current-series', limit: 2, tags: ['typescript', 'auth'] }

    expect((await getRelatedPosts(options)).map(p => p.id)).toEqual(['2024/already-recommended/index.md', 'more-related'])
    expect((await getRelatedPosts({ ...options, excludeUrls: ['/blog/already-recommended/'] })).map(p => p.id)).toEqual(['more-related', 'newer'])
  })

  test('matches local paths and exact canonical destinations despite queries, fragments, encoding, or trailing slashes', async () => {
    getCollectionMock.mockResolvedValue([
      post('2024/local/index.mdx'),
      post('canonical', { canonicalUrl: 'https://medium.com/@author/canonical' }),
      post('remaining')
    ])
    const { getRelatedPosts } = await import('../content')

    expect((await getRelatedPosts({ currentPostId: 'current',
      tags: ['typescript'],
      excludeUrls: [
        'https://santi020k.com/blog/%6cocal?source=ledger#context',
        'https://medium.com/@author/canonical/?source=ledger#context'
      ] })).map(p => p.id)).toEqual(['remaining'])
  })

  test('does not confuse foreign URLs, archives, topic indexes, or malformed URLs with article destinations', async () => {
    getCollectionMock.mockResolvedValue([post('guide')])
    const { getRelatedPosts } = await import('../content')

    expect((await getRelatedPosts({ currentPostId: 'current',
      tags: ['typescript'],
      excludeUrls: [
        'https://example.com/blog/guide/',
        '/v4/blog/guide/',
        '/blog/tags/guide/',
        '/blog/series/guide/',
        'https://[',
        '/blog/%ZZ/',
        'javascript:alert(1)'
      ] })).map(p => p.id)).toEqual(['guide'])
  })

  test('never fills slots with drafts, scheduled posts, or unrelated articles, even in development', async () => {
    getCollectionMock.mockResolvedValue([
      post('draft', { draft: true }),
      post('future', { publishDate: new Date('2027-01-01T12:00:00Z') }),
      post('unrelated', { tags: ['travel'] }),
      post('only-eligible', { publishDate: new Date('2026-10-26T12:00:00Z') })
    ])
    const { getRelatedPosts } = await import('../content')
    const options = { currentPostId: 'current', tags: ['typescript'], limit: 2 }

    expect((await getRelatedPosts(options)).map(p => p.id)).toEqual(['only-eligible'])
    expect(await getRelatedPosts({ ...options, excludeUrls: ['/blog/only-eligible/', '/blog/missing/'] })).toEqual([])
  })
})
