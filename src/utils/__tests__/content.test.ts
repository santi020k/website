import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

interface MockEntry {
  id: string
  data: { draft?: boolean, publishDate: Date }
}

type MockFilter = (entry: MockEntry) => boolean

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn<(collection: string, filter?: MockFilter) => Promise<MockEntry[]>>()
}))

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock
}))

const collections = [
  ['posts', 'getCachedPosts'],
  ['projects', 'getCachedProjects'],
  ['series', 'getCachedSeries']
] as const

describe('content collection caching', () => {
  beforeEach(() => {
    vi.resetModules()
    getCollectionMock.mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test.each(collections)('refreshes %s from Astro during development', async (_name, getter) => {
    vi.stubEnv('PROD', false)
    const content = await import('../content')

    await content[getter]()
    await content[getter]()

    expect(getCollectionMock).toHaveBeenCalledTimes(2)
  })

  test.each(collections)('isolates %s sorting and removal from later build consumers', async (_name, getter) => {
    vi.stubEnv('PROD', true)
    const entries = [
      { id: 'newer', data: { publishDate: new Date('2026-02-01') } },
      { id: 'older', data: { publishDate: new Date('2026-01-01') } }
    ]
    getCollectionMock.mockResolvedValue(entries)
    const content = await import('../content')
    const first = await content[getter]()

    first.reverse()
    first.pop()

    const second = await content[getter]()
    expect(second.map(entry => entry.id)).toEqual(['newer', 'older'])
    second.splice(0)

    expect((await content[getter]()).map(entry => entry.id)).toEqual(['newer', 'older'])
    expect(entries.map(entry => entry.id)).toEqual(['newer', 'older'])
    expect(getCollectionMock).toHaveBeenCalledTimes(1)
  })

  test.each(collections)('shares an in-flight %s load while returning independent arrays', async (_name, getter) => {
    vi.stubEnv('PROD', true)
    let finishLoad: (entries: MockEntry[]) => void = () => {
      throw new Error('Load did not start')
    }

    getCollectionMock.mockReturnValue(new Promise(resolve => {
      finishLoad = resolve
    }))
    const content = await import('../content')
    const first = content[getter]()
    const second = content[getter]()

    expect(getCollectionMock).toHaveBeenCalledTimes(1)
    finishLoad([{ id: 'entry', data: { publishDate: new Date('2026-01-01') } }])
    const [firstEntries, secondEntries] = await Promise.all([first, second])

    firstEntries.splice(0)
    expect(secondEntries.map(entry => entry.id)).toEqual(['entry'])
    expect((await content[getter]()).map(entry => entry.id)).toEqual(['entry'])
    expect(getCollectionMock).toHaveBeenCalledTimes(1)
  })

  test.each(collections)('retries one shared %s failure for later callers', async (_name, getter) => {
    vi.stubEnv('PROD', true)
    let failLoad: (error: Error) => void = () => {
      throw new Error('Load did not start')
    }

    getCollectionMock.mockReturnValueOnce(new Promise((_resolve, reject) => {
      failLoad = reject
    }))
    const content = await import('../content')
    const first = content[getter]()
    const second = content[getter]()
    const outcomes = Promise.allSettled([first, second])

    failLoad(new Error('Collection unavailable'))
    expect(await outcomes).toEqual([
      { status: 'rejected', reason: new Error('Collection unavailable') },
      { status: 'rejected', reason: new Error('Collection unavailable') }
    ])
    await expect(content[getter]()).resolves.toEqual([])
    await expect(content[getter]()).resolves.toEqual([])
    expect(getCollectionMock).toHaveBeenCalledTimes(2)
  })

  test('sorts posts without mutating the collection supplied by Astro', async () => {
    const entries = [
      { id: 'older', data: { publishDate: new Date('2026-01-01') } },
      { id: 'newer', data: { publishDate: new Date('2026-02-01') } }
    ]
    getCollectionMock.mockResolvedValue(entries)
    const { getCachedPosts } = await import('../content')

    expect((await getCachedPosts()).map(entry => entry.id)).toEqual(['newer', 'older'])
    expect(entries.map(entry => entry.id)).toEqual(['older', 'newer'])
  })

  test.each(collections)('retries a failed %s load without caching the failure', async (_name, getter) => {
    vi.stubEnv('PROD', true)
    getCollectionMock.mockRejectedValueOnce(new Error('Collection unavailable'))
    const content = await import('../content')

    await expect(content[getter]()).rejects.toThrow('Collection unavailable')
    await expect(content[getter]()).resolves.toEqual([])
    await expect(content[getter]()).resolves.toEqual([])
    expect(getCollectionMock).toHaveBeenCalledTimes(2)
  })
})

describe('published post filtering', () => {
  const now = new Date('2030-06-15T12:00:00.000Z')
  const hour = 3_600_000
  const day = 24 * hour

  const post = (id: string, offset: number, draft = false): MockEntry => ({
    id,
    data: { draft, publishDate: new Date(now.getTime() + offset) }
  })

  const posts = [
    post('next-millisecond', 1),
    post('yesterday', -day),
    post('past-draft', -hour, true),
    post('exactly-now', 0),
    post('scheduled-draft', day, true),
    post('last-month', -30 * day)
  ]

  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers({ now, toFake: ['Date'] })
    // Apply the filter content.ts supplies, as Astro's getCollection does.
    getCollectionMock.mockReset().mockImplementation((collection, filter) => {
      const entries = collection === 'post' ? posts : []

      return Promise.resolve(filter ? entries.filter(filter) : [...entries])
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  test('publishes past and current posts newest first, excluding drafts and future posts', async () => {
    vi.stubEnv('PROD', true)
    const { getCachedPosts } = await import('../content')

    expect((await getCachedPosts()).map(entry => entry.id)).toEqual(['exactly-now', 'yesterday', 'last-month'])
  })

  test('shows drafts and scheduled posts newest first during development', async () => {
    vi.stubEnv('PROD', false)
    const { getCachedPosts } = await import('../content')

    expect((await getCachedPosts()).map(entry => entry.id)).toEqual([
      'scheduled-draft',
      'next-millisecond',
      'exactly-now',
      'past-draft',
      'yesterday',
      'last-month'
    ])
  })
})
