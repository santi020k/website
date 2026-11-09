import type { SearchIndexEntry } from '@/types/search'
import { createFullTextSearch, decodeSearchExcerpt } from '@/utils/full-text-search'

import { afterEach, describe, expect, test, vi } from 'vitest'

const entry: SearchIndexEntry = {
  description: 'Existing description', path: '/blog/example/', tags: [], title: 'Example', type: 'post'
}
const origin = 'https://santi020k.com'
const record = (url = entry.path, plainExcerpt = 'A &lt;useful&gt; body match.') => ({
  data: () => Promise.resolve({ plain_excerpt: plainExcerpt, url })
})

afterEach(() => vi.useRealTimers())

describe('optional body search', () => {
  test('returns published body matches and reuses the lazy module', async () => {
    const load = vi.fn(() => Promise.resolve({
      debouncedSearch: () => Promise.resolve({ results: [record()] })
    }))
    const search = createFullTextSearch(load)

    expect(await search('useful', [entry], new Set(), origin)).toEqual({
      hits: [{ entry, excerpt: 'A <useful> body match.' }], unavailable: false
    })
    await search('body', [entry], new Set(), origin)
    expect(load).toHaveBeenCalledTimes(1)
  })

  test('drops duplicates, unknown entries, external URLs, and already displayed matches', async () => {
    const search = createFullTextSearch(() => Promise.resolve({
      debouncedSearch: () => Promise.resolve({ results: [
        record('/blog/example/index.html'),
        record(),
        record('//evil.example/blog/example/'),
        record('/v4/blog/example/'),
        record('/blog/draft/')
      ] })
    }))

    expect((await search('body', [entry], new Set(), origin)).hits).toHaveLength(1)
    expect((await search('body', [entry], new Set([entry.path]), origin)).hits).toEqual([])
  })

  test('keeps healthy fragments when another result fetch fails', async () => {
    const search = createFullTextSearch(() => Promise.resolve({
      debouncedSearch: () => Promise.resolve({ results: [
        { data: () => Promise.reject(new Error('fragment unavailable')) }, record()
      ] })
    }))

    const result = await search('body', [entry], new Set(), origin)

    expect(result.hits).toHaveLength(1)
    expect(result.unavailable).toBe(true)
  })

  test.each(['load', 'search', 'data', 'invalid-module', 'invalid-response'])(
    'settles %s failures without rejecting and permits a later retry', async failure => {
      let fail = true
      const loader = vi.fn(() => {
        if (fail && failure === 'load') return Promise.reject(new Error('network'))
        if (fail && failure === 'invalid-module') return Promise.resolve({})

        return Promise.resolve({
          debouncedSearch: () => {
            if (fail && failure === 'search') return Promise.reject(new Error('wasm'))
            if (fail && failure === 'invalid-response') return Promise.resolve({ results: [null] })

            return Promise.resolve({ results: [fail && failure === 'data' ?
              { data: () => Promise.reject(new Error('fragment')) } :
              record()] })
          }
        })
      })
      const search = createFullTextSearch(loader)

      expect(await search('body', [entry], new Set(), origin)).toEqual({ hits: [], unavailable: true })
      fail = false
      expect((await search('body', [entry], new Set(), origin)).hits).toHaveLength(1)
    }
  )

  test.each(['load', 'search', 'data'])('bounds a stalled %s request', async stage => {
    vi.useFakeTimers()
    const never = () => new Promise<unknown>(() => {})
    const search = createFullTextSearch(() => stage === 'load' ?
      never() :
      Promise.resolve({
        debouncedSearch: () => stage === 'search' ? never() : Promise.resolve({ results: [{ data: never }] })
      }), 100)
    const pending = search('body', [entry], new Set(), origin)

    await vi.advanceTimersByTimeAsync(101)
    expect(await pending).toEqual({ hits: [], unavailable: true })
  })

  test('settles canceled debounced queries without reporting an outage', async () => {
    const search = createFullTextSearch(() => Promise.resolve({ debouncedSearch: () => Promise.resolve(null) }))

    expect(await search('body', [entry], new Set(), origin)).toEqual({ hits: [], unavailable: false })
  })

  test('decodes entities once without interpreting markup', () => {
    expect(decodeSearchExcerpt('&lt;script&gt;alert(1)&lt;/script&gt; &amp;lt; &#xF1; &#241;')).toBe(
      '<script>alert(1)</script> &lt; ñ ñ'
    )
    expect(decodeSearchExcerpt('&#0; &#xD800; &#x110000;')).toBe('&#0; &#xD800; &#x110000;')
  })
})

test('reinitializes body search when client navigation changes language', async () => {
  const destroy = vi.fn()
  const search = createFullTextSearch(() => Promise.resolve({
    destroy,
    debouncedSearch: () => Promise.resolve({ results: [] })
  }))

  await search('one', [], new Set(), origin, 'en')
  await search('uno', [], new Set(), origin, 'es')
  await search('dos', [], new Set(), origin, 'es')
  expect(destroy).toHaveBeenCalledTimes(1)
  await search('two', [], new Set(), origin, 'en')
  expect(destroy).toHaveBeenCalledTimes(2)
})

test('bounds a stalled language reset and lets the next query retry', async () => {
  vi.useFakeTimers()
  const destroy = vi.fn<() => Promise<void>>()
    .mockImplementationOnce(() => new Promise<void>(() => {}))
    .mockResolvedValue(undefined)
  const debouncedSearch = vi.fn(() => Promise.resolve({ results: [] }))
  const search = createFullTextSearch(() => Promise.resolve({ destroy, debouncedSearch }), 100)

  await search('one', [], new Set(), origin, 'en')
  const pending = search('uno', [], new Set(), origin, 'es')

  await vi.advanceTimersByTimeAsync(101)
  expect(await pending).toEqual({ hits: [], unavailable: true })
  expect(debouncedSearch).toHaveBeenCalledTimes(1)
  expect(await search('dos', [], new Set(), origin, 'es')).toEqual({ hits: [], unavailable: false })
  expect(destroy).toHaveBeenCalledTimes(2)
})
