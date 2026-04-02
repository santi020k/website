import { existsSync, readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// We will import these dynamically in beforeEach to handle module state reset
let filterWebmentions: any
let getWebmentionsForUrl: any

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFile: vi.fn((_path, _data, callback) => {
    if (typeof callback === 'function') callback(null)
  })
}))

describe('webmentions', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    
    // Re-import to reset internal variables like webmentionsCache
    const mod = await import('../webmentions')
    filterWebmentions = mod.filterWebmentions
    getWebmentionsForUrl = mod.getWebmentionsForUrl

    // Mock fetch globally
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ children: [] })
    })
  })

  it('should filter out unsupported types', () => {
    const input = [
      { 'wm-property': 'like-of' },
      { 'wm-property': 'unsupported-type' }
    ] as any[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.['wm-property']).toBe('like-of')
  })

  it('should filter out mention-of without content', () => {
    const input = [
      { 'wm-property': 'mention-of', content: { text: '' } },
      { 'wm-property': 'mention-of', content: { text: 'Hello' } }
    ] as any[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.content?.text).toBe('Hello')
  })

  describe('getWebmentionsForUrl', () => {
    it('should fetch webmentions when cache is empty', async () => {
      vi.mocked(existsSync).mockReturnValue(false)
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          children: [
            { 'wm-id': 1, 'wm-target': 'https://santi020k.me/posts/test/', 'wm-property': 'like-of' }
          ]
        })
      })

      const result = await getWebmentionsForUrl('https://santi020k.me/posts/test/')
      expect(result).toHaveLength(1)
      expect(result[0]?.['wm-id']).toBe(1)
    })

    it('should return cached webmentions if available', async () => {
      // Mock existsSync for the specific cache file path
      vi.mocked(existsSync).mockReturnValue(true)
      
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
        lastFetched: new Date().toISOString(),
        children: [
          { 'wm-id': 2, 'wm-target': 'https://santi020k.me/posts/cached/', 'wm-property': 'like-of' }
        ]
      }))

      // Return null from fetch to simulate "no new mentions" or just let it return empty
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ children: [] })
      })

      const result = await getWebmentionsForUrl('https://santi020k.me/posts/cached/')
      expect(result).toHaveLength(1)
      expect(result[0]?.['wm-id']).toBe(2)
    })
  })
})
