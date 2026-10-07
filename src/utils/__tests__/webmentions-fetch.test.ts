import { afterEach, describe, expect, test, vi } from 'vitest'

import { fetchWebmentionsForTarget } from '../webmentions-fetch'

describe('fetchWebmentionsForTarget', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('returns public mentions from a jf2 feed', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [
            {
              'wm-id': 9,
              'wm-private': false,
              'wm-property': 'like-of',
              'wm-source': 'https://alice.example/note',
              'wm-target': 'https://santi020k.com/blog/hello/',
              author: { name: 'Alice', photo: 'https://alice.example/a.jpg', type: 'card', url: 'https://alice.example/' },
              type: 'entry',
              url: 'https://alice.example/note'
            },
            {
              'wm-id': 10,
              'wm-private': true,
              'wm-property': 'like-of',
              'wm-source': 'https://private.example/',
              'wm-target': 'https://santi020k.com/blog/hello/',
              type: 'entry',
              url: 'https://private.example/'
            }
          ]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(fetch).toHaveBeenCalledWith(
      'https://webmention.io/api/mentions.jf2?target=https%3A%2F%2Fsanti020k.com%2Fblog%2Fhello%2F',
      expect.objectContaining({
        headers: { Accept: 'application/jf2+json, application/json', Authorization: 'Bearer test-token' }
      })
    )
    expect(out).toHaveLength(1)
    expect(out[0]?.['wm-source']).toBe('https://alice.example/note')
    expect(out[0]?.author).toEqual({
      name: 'Alice',
      photo: 'https://alice.example/a.jpg',
      url: 'https://alice.example/'
    })
  })

  test('returns an empty list when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  test('returns an empty list when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  test('returns an empty list when the response body parses to null', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null)
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  test.each([42, 'unexpected', true, []])(
    'returns an empty list when the response body is %p',
    async body => {
      vi.stubGlobal(
        'fetch', vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(body)
        })
      )

      const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
      expect(out).toEqual([])
    }
  )

  test('ignores non-object entries inside an otherwise valid children array', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [
            null,
            'not-an-object',
            42,
            {
              'wm-property': 'like-of',
              'wm-source': 'https://alice.example/note'
            }
          ]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toHaveLength(1)
    expect(out[0]?.['wm-source']).toBe('https://alice.example/note')
  })

  test('drops an entry missing a usable wm-source', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{ 'wm-property': 'like-of' }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  test('drops an entry whose wm-source uses an unsafe scheme', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{ 'wm-property': 'like-of', 'wm-source': 'javascript:alert(document.cookie)' }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  test('keeps a legitimate mention but strips an unsafe author url', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'in-reply-to',
            'wm-source': 'https://alice.example/note',
            author: { name: 'Alice', url: 'javascript:alert(document.cookie)' }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toHaveLength(1)
    expect(out[0]?.author?.name).toBe('Alice')
    expect(out[0]?.author?.url).toBeNull()
  })

  test('keeps a legitimate mention but strips an unsafe author photo', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'like-of',
            'wm-source': 'https://alice.example/note',
            author: { name: 'Alice', photo: 'data:text/html,<script>alert(1)</script>' }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toHaveLength(1)
    expect(out[0]?.author?.photo).toBeNull()
  })

  test('normalizes an author photo supplied as an array to its first safe URL', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'like-of',
            'wm-source': 'https://alice.example/note',
            author: { name: 'Alice', photo: ['https://alice.example/a.jpg', 'https://alice.example/b.jpg'] }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out[0]?.author?.photo).toBe('https://alice.example/a.jpg')
  })

  test('keeps a mention without an author', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{ 'wm-property': 'mention-of', 'wm-source': 'https://alice.example/note' }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toHaveLength(1)
    expect(out[0]?.author).toBeNull()
  })

  test.each([42, '', ' \t\n '])('ignores an unusable author name %p', async name => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'like-of',
            'wm-source': 'https://alice.example/note',
            author: { name }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out[0]?.author?.name).toBeNull()
  })

  test.each(['', ' \t\n '])('falls back to the summary when content text is %p', async text => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'in-reply-to',
            'wm-source': 'https://alice.example/note',
            content: { text },
            summary: { value: 'Great post!' }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out[0]?.content).toBeNull()
    expect(out[0]?.summary).toEqual({ value: 'Great post!' })
  })
})
