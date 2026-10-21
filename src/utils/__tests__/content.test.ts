import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

interface MockEntry {
  id: string
  data: { publishDate: Date }
}

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn<() => Promise<MockEntry[]>>()
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
