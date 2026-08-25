import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getCachedPosts, getCachedProjects, getCachedSeries } from '../content'

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn().mockResolvedValue([])
}))

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock
}))

describe('content collection caching', () => {
  beforeEach(() => {
    getCollectionMock.mockClear()
  })

  test.each([
    ['posts', getCachedPosts],
    ['projects', getCachedProjects],
    ['series', getCachedSeries]
  ])('refreshes %s from Astro during development', async (_name, getEntries) => {
    await getEntries()
    await getEntries()

    expect(getCollectionMock).toHaveBeenCalledTimes(2)
  })
})
