import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchWebmentionsForTarget } from '../webmentions-fetch'

describe('fetchWebmentionsForTarget', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns public mentions from a jf2 feed', async () => {
    vi.stubGlobal(
      'fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
    expect(out).toHaveLength(1)
    expect(out[0]?.['wm-id']).toBe(9)
  })

  it('returns an empty list when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })

  it('returns an empty list when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const out = await fetchWebmentionsForTarget('https://santi020k.com/blog/hello/', 'test-token')
    expect(out).toEqual([])
  })
})
