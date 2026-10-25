import { afterEach, describe, expect, test, vi } from 'vitest'

import { fetchWebmentionsForTarget } from '../webmentions-fetch'

const target = 'https://santi020k.com/blog/hello/'

const like = (id: number, extra: Record<string, unknown> = {}) => ({
  'wm-id': id,
  'wm-property': 'like-of',
  'wm-source': `https://fan${id}.example/note`,
  ...extra
})

interface PageFixture {
  children: unknown[]
  paging?: unknown
}

/** One jf2 page with the paging fields consumed by the loader. */
const page = (index: number, totalPages: number, children: unknown[]): PageFixture => ({
  children,
  paging: { page: index, 'per-page': 1000, 'total-pages': totalPages }
})

const jsonResponse = (body: unknown) => ({ ok: true, json: () => Promise.resolve(body) })

/** Serves `pages[n]` for `?page=n`; a function entry supplies a custom response. */
const pagedFetch = (pages: (PageFixture | (() => Promise<unknown>))[]) => vi.fn(
  (input: string, _init?: RequestInit): Promise<unknown> => {
    const entry = pages[Number(new URL(input).searchParams.get('page'))]

    if (typeof entry === 'function') return entry()

    return Promise.resolve(entry ? jsonResponse(entry) : { ok: false })
  }
)

const sources = (mentions: { 'wm-source': string }[]) => mentions.map(entry => entry['wm-source'])

describe('fetchWebmentionsForTarget', () => {
  afterEach(() => {
    vi.useRealTimers()
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
      'https://webmention.io/api/mentions.jf2?target=https%3A%2F%2Fsanti020k.com%2Fblog%2Fhello%2F' +
      '&per-page=1000&page=0&sort-by=created&sort-dir=down',
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

  test.each([
    [{ 'content-type': 'text/plain', value: 'Legacy reply' }, 'Legacy reply'],
    [{ text: 'Current reply', value: 'Legacy reply' }, 'Current reply'],
    [{ text: '   ', value: 'Legacy reply' }, 'Legacy reply'],
    [{ text: 42, value: 'Legacy reply' }, 'Legacy reply'],
    [{ value: 42 }, null],
    [{ value: '   ' }, null]
  ])('normalizes modern and legacy reply content %j', async (content, expectedText) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        children: [{
          'wm-property': 'in-reply-to',
          'wm-source': 'https://alice.example/reply',
          content
        }]
      })
    }))

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')

    expect(out[0]?.content).toEqual(expectedText === null ? null : { text: expectedText })
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

  test.each([
    { label: 'non-string', name: 42 },
    { label: 'empty', name: '' },
    { label: 'whitespace', name: ' \t\n ' },
    { label: 'zero-width space', name: '\u200b' },
    { label: 'joiners', name: '\u200c\u200d' },
    { label: 'direction marks and embedding', name: '\u200e\u200f\u202a\u202c' },
    { label: 'word joiner', name: '\u2060' },
    { label: 'soft hyphen', name: '\u00ad' },
    { label: 'combining grapheme joiner', name: '\u034f' },
    { label: 'Arabic direction mark', name: '\u061c' },
    { label: 'variation selector', name: '\ufe0f' },
    { label: 'supplementary variation selector', name: '\u{E0100}' },
    { label: 'Hangul fillers', name: '\u115f\u1160' },
    { label: 'compatibility Hangul fillers', name: '\u3164\uffa0' },
    { label: 'tag characters', name: '\u{E0061}\u{E007F}' },
    { label: 'NUL and C0/C1 controls', name: '\u0000\u0001\u007f\u0085\u009f' },
    { label: 'next-line control and line separator', name: '\u0085\u2028' },
    { label: 'invisible text mixed with whitespace', name: ' \u200b\t\u00ad\n ' }
  ])('ignores an unusable author name: $label', async ({ name }) => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [{
            'wm-property': 'like-of',
            'wm-source': 'https://alice.example/note',
            author: { name, photo: 'https://alice.example/a.jpg', url: 'https://alice.example/' }
          }]
        })
      })
    )

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toHaveLength(1)
    expect(out[0]?.['wm-source']).toBe('https://alice.example/note')
    expect(out[0]?.author).toEqual({
      name: null,
      photo: 'https://alice.example/a.jpg',
      url: 'https://alice.example/'
    })
  })

  test.each([
    'Alice',
    '𠮷田',
    'E\u0301',
    'می\u200cنا',
    '👩🏽‍💻',
    '❤️',
    '🇨🇴',
    '\u200eAlice\u200f',
    '\u061c\u0633\u0627\u0631\u0629',
    '\u1100\u1160',
    '\u0301',
    '\u0903',
    '—',
    '123',
    'A\u00a0B',
    'A\u0001B',
    '\u06dd',
    '\u0600',
    '\u200bAlice',
    '\u0915\u094d\u200d\u0937',
    '\u2067\u05e9\u05dc\u05d5\u05dd\u2069',
    '\u2800',
    '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'
  ])('preserves meaningful Unicode author names after trimming %p', async name => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      children: [like(1, { author: { name: ` \t${name}\n ` } })]
    })))

    const out = await fetchWebmentionsForTarget(target, 'test-token')

    expect(out).toHaveLength(1)
    expect(out[0]?.author?.name).toBe(name)
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

  describe('pagination', () => {
    test('walks every page and keeps the API newest-first order', async () => {
      const fetchMock = pagedFetch([
        page(0, 3, [like(9), like(8)]),
        page(1, 3, [like(7), like(6)]),
        page(2, 3, [like(5)])
      ])

      vi.stubGlobal('fetch', fetchMock)

      const out = await fetchWebmentionsForTarget(target, 'secret-token')

      expect(sources(out)).toEqual([
        'https://fan9.example/note',
        'https://fan8.example/note',
        'https://fan7.example/note',
        'https://fan6.example/note',
        'https://fan5.example/note'
      ])
      expect(fetchMock).toHaveBeenCalledTimes(3)

      for (const [index, [url, init]] of fetchMock.mock.calls.entries()) {
        const params = new URL(url).searchParams

        expect(params.get('page')).toBe(String(index))
        expect(params.get('per-page')).toBe('1000')
        expect(params.get('sort-by')).toBe('created')
        expect(params.get('sort-dir')).toBe('down')
        expect(url).not.toContain('secret-token')
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer secret-token' }))
      }
    })

    test('follows a total-pages count that grows while the walk is in progress', async () => {
      vi.stubGlobal('fetch', pagedFetch([
        page(0, 2, [like(9)]),
        page(1, 3, [like(8)]),
        page(2, 3, [like(7)])
      ]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(sources(out)).toEqual([
        'https://fan9.example/note',
        'https://fan8.example/note',
        'https://fan7.example/note'
      ])
    })

    test('drops a row repeated on the next page after a new mention shifts the feed', async () => {
      vi.stubGlobal('fetch', pagedFetch([
        page(0, 2, [like(9), like(8)]),
        page(1, 2, [like(8), like(7)])
      ]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(sources(out)).toEqual([
        'https://fan9.example/note',
        'https://fan8.example/note',
        'https://fan7.example/note'
      ])
    })

    test.each([
      ['an error status', () => Promise.resolve({ ok: false })],
      ['a network error', () => Promise.reject(new Error('network'))],
      ['an invalid JSON body', () => Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError('bad json')) })],
      ['a body without children', () => Promise.resolve(jsonResponse({ paging: { page: 1, 'total-pages': 2 } }))],
      ['a body without paging', () => Promise.resolve(jsonResponse({ children: [like(7)] }))]
    ])('returns nothing rather than a partial list when a later page has %s', async (_label, laterPage) => {
      vi.stubGlobal('fetch', pagedFetch([page(0, 2, [like(9), like(8)]), laterPage]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(out).toEqual([])
    })

    test.each([
      ['echoes the wrong page number', page(0, 3, [like(7)])],
      ['repeats only rows already seen', page(1, 3, [like(9), like(8)])],
      ['is empty while still in range', page(1, 3, [])],
      ['shrinks past the requested page', page(1, 1, [like(7)])],
      ['reports a non-integer page count', { children: [like(7)], paging: { page: 1, 'total-pages': 2.5 } }],
      ['reports a negative page count', { children: [like(7)], paging: { page: 1, 'total-pages': -1 } }]
    ])('returns nothing when a later page %s', async (_label, laterPage) => {
      vi.stubGlobal('fetch', pagedFetch([page(0, 3, [like(9), like(8)]), laterPage, page(2, 3, [like(6)])]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(out).toEqual([])
    })

    test('refuses a feed with more pages than the bound instead of truncating it', async () => {
      const fetchMock = pagedFetch([page(0, 1_000_000, [like(9)])])

      vi.stubGlobal('fetch', fetchMock)

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(out).toEqual([])
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['repeated rows', [like(9), like(8)]],
      ['no rows', []]
    ])('rejects a claimed final page with %s instead of returning an incomplete count', async (_label, rows) => {
      vi.stubGlobal('fetch', pagedFetch([page(0, 2, [like(9), like(8)]), page(1, 2, rows)]))

      await expect(fetchWebmentionsForTarget(target, 'test-token')).resolves.toEqual([])
    })

    test('refuses an unpaginated response that may have been cut at the page size', async () => {
      const children = Array.from({ length: 1000 }, (_, index) => like(index))

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ children })))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(out).toEqual([])
    })

    test('omits private rows on every page while counting them as progress', async () => {
      vi.stubGlobal('fetch', pagedFetch([
        page(0, 3, [like(9), like(8, { 'wm-private': true })]),
        page(1, 3, [like(7, { 'wm-private': true })]),
        page(2, 3, [like(6)])
      ]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(sources(out)).toEqual(['https://fan9.example/note', 'https://fan6.example/note'])
    })

    test('validates URLs on later pages', async () => {
      vi.stubGlobal('fetch', pagedFetch([
        page(0, 2, [like(9)]),
        page(1, 2, [
          like(8, { 'wm-source': 'javascript:alert(1)' }),
          like(7, { author: { name: 'Eve', photo: 'data:image/svg+xml,<svg/>', url: 'javascript:alert(2)' } })
        ])
      ]))

      const out = await fetchWebmentionsForTarget(target, 'test-token')

      expect(sources(out)).toEqual(['https://fan9.example/note', 'https://fan7.example/note'])
      expect(out[1]?.author).toEqual({ name: 'Eve', photo: null, url: null })
    })
  })

  describe('load deadline', () => {
    test('gives up on a request that never settles, even if it ignores the abort signal', async () => {
      vi.useFakeTimers()

      const fetchMock = vi.fn((_input: string, _init?: RequestInit) => new Promise<never>(() => {}))

      vi.stubGlobal('fetch', fetchMock)

      let settled = false
      const pending = fetchWebmentionsForTarget(target, 'test-token').then(mentions => {
        settled = true

        return mentions
      })

      await vi.advanceTimersByTimeAsync(11_999)
      expect(settled).toBe(false)
      expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false)
      await vi.advanceTimersByTimeAsync(1)

      await expect(pending).resolves.toEqual([])
      expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    })

    test('bounds the whole multi-page load, including a body that never finishes', async () => {
      vi.useFakeTimers()

      const fetchMock = pagedFetch([
        page(0, 2, [like(9)]),
        () => Promise.resolve({ ok: true, json: () => new Promise<never>(() => {}) })
      ])

      vi.stubGlobal('fetch', fetchMock)

      const pending = fetchWebmentionsForTarget(target, 'test-token')

      await vi.advanceTimersByTimeAsync(12_000)

      await expect(pending).resolves.toEqual([])
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
