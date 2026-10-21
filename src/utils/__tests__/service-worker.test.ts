import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, test, vi } from 'vitest'

const source = readFileSync(resolvePath(process.cwd(), 'public/sw.js'), 'utf8')
const origin = 'https://santi020k.com'

const setupWorker = () => {
  const handlers = new Map<string, (event: unknown) => void>()
  const cache = {
    delete: vi.fn<(request: Request) => Promise<boolean>>().mockResolvedValue(true),
    keys: vi.fn<() => Promise<Request[]>>().mockResolvedValue([]),
    match: vi.fn<(request: Request | string) => Promise<Response | undefined>>().mockResolvedValue(undefined),
    put: vi.fn<(request: Request, response: Response) => Promise<void>>().mockResolvedValue(undefined)
  }
  const open = vi.fn(() => Promise.resolve(cache))
  const fetch = vi.fn<typeof globalThis.fetch>()

  runInNewContext(source, {
    Response,
    URL,
    caches: { open },
    fetch,
    self: {
      addEventListener: (type: string, handler: (event: unknown) => void) => handlers.set(type, handler),
      location: { origin }
    }
  })

  const dispatch = (request: Request) => {
    const handler = handlers.get('fetch')

    if (!handler) throw new Error('Missing fetch handler')

    let response: Promise<Response> | undefined
    const lifetime: Promise<unknown>[] = []

    handler({
      request,
      respondWith: (value: Promise<Response>) => {
        response = value
      },
      waitUntil: (value: Promise<unknown>) => {
        lifetime.push(value)
      }
    })

    return { lifetime, response }
  }

  return { cache, dispatch, fetch, open }
}

const makeRequest = (path: string, navigation = false) => {
  const request = new Request(new URL(path, origin))

  if (navigation) Object.defineProperty(request, 'mode', { value: 'navigate' })

  return request
}

describe('Service worker fetch handling', () => {
  test.each(['/v1', '/v1/', '/v2/blog/post/', '/v3/_astro/app.js', '/v12/fonts/font.woff2'])(
    'leaves archive request %s to the network', path => {
      const worker = setupWorker()
      expect(worker.dispatch(makeRequest(path)).response).toBeUndefined()
      expect(worker.open).not.toHaveBeenCalled()
      expect(worker.fetch).not.toHaveBeenCalled()
    }
  )

  test.each(['/fresh/', '/pdf/cv.pdf', '/_astro/new.js'])(
    'returns %s before a slow cache write completes', async path => {
      const worker = setupWorker()
      let finishWrite: () => void = () => {
        throw new Error('Write did not start')
      }
      const write = new Promise<void>(resolve => {
        finishWrite = resolve
      })

      worker.cache.put.mockReturnValue(write)
      worker.fetch.mockResolvedValue(new Response('fresh response'))
      const event = worker.dispatch(makeRequest(path))

      expect(await (await event.response)?.text()).toBe('fresh response')
      expect(worker.cache.put).toHaveBeenCalledTimes(1)
      expect(worker.cache.keys).not.toHaveBeenCalled()
      expect(event.lifetime).toHaveLength(1)
      finishWrite()
      await Promise.all(event.lifetime)
      expect(worker.cache.keys).toHaveBeenCalledTimes(1)
      expect(await worker.cache.put.mock.calls[0]?.[1].text()).toBe('fresh response')
    }
  )

  test('serves a cached asset offline', async () => {
    const worker = setupWorker()

    worker.cache.match.mockResolvedValue(new Response('cached asset'))
    worker.fetch.mockRejectedValue(new TypeError('Offline'))

    const event = worker.dispatch(makeRequest('/_astro/app.js'))
    const response = await event.response

    expect(await response?.text()).toBe('cached asset')
    await Promise.all(event.lifetime)
  })

  test('returns a network error response for an uncached offline asset', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))

    const event = worker.dispatch(makeRequest('/_astro/new.js'))
    const response = await event.response

    expect(response).toBeInstanceOf(Response)
    expect(response?.type).toBe('error')
    await Promise.all(event.lifetime)
  })

  test.each([false, true])('preserves a successful response when cache writes fail (navigation: %s)', async navigation => {
    const worker = setupWorker()

    worker.fetch.mockResolvedValue(new Response('fresh response'))
    worker.cache.put.mockRejectedValue(new DOMException('Storage full', 'QuotaExceededError'))

    const event = worker.dispatch(makeRequest('/fresh/', navigation))
    const response = await event.response

    expect(await response?.text()).toBe('fresh response')
    await Promise.all(event.lifetime)
  })

  test.each([false, true])('works without cache storage (navigation: %s)', async navigation => {
    const worker = setupWorker()

    worker.open.mockRejectedValue(new Error('Storage unavailable'))
    worker.fetch.mockResolvedValue(new Response('network response'))

    const event = worker.dispatch(makeRequest('/fresh/', navigation))
    const response = await event.response

    expect(await response?.text()).toBe('network response')
    await Promise.all(event.lifetime)
  })

  test('uses the offline document for an uncached navigation', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockImplementation(request => Promise.resolve(
      request === '/offline/' ? new Response('Offline page') : undefined
    ))

    const { response } = worker.dispatch(makeRequest('/never-visited/', true))

    expect(await (await response)?.text()).toBe('Offline page')
  })

  test('returns a network error when navigation has no usable cache', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockRejectedValue(new Error('Cache read failed'))

    const { response } = worker.dispatch(makeRequest('/never-visited/', true))

    expect((await response)?.type).toBe('error')
  })

  test('keeps refreshing an asset with a stable filename after returning its cached response', async () => {
    const worker = setupWorker()
    let completeNetwork: (response: Response) => void = () => {
      throw new Error('Network request not initialized')
    }
    const network = new Promise<Response>(resolve => {
      completeNetwork = resolve
    })

    worker.cache.match.mockResolvedValue(new Response('cached asset'))
    worker.fetch.mockReturnValue(network)

    const event = worker.dispatch(makeRequest('/favicon.svg'))

    expect(event.lifetime).toHaveLength(1)
    expect(await (await event.response)?.text()).toBe('cached asset')
    expect(worker.cache.put).not.toHaveBeenCalled()

    completeNetwork(new Response('updated asset'))
    await Promise.all(event.lifetime)

    const storedResponse = worker.cache.put.mock.calls[0]?.[1]

    expect(await storedResponse?.text()).toBe('updated asset')
  })

  test.each(['/api/data', '/_image?src=cover.webp', '/_vercel/insights', 'https://example.com/image.png'])('leaves excluded requests to the browser: %s', path => {
    const worker = setupWorker()
    const event = worker.dispatch(makeRequest(path))

    expect(event.response).toBeUndefined()
    expect(event.lifetime).toEqual([])
    expect(worker.fetch).not.toHaveBeenCalled()
  })

  test('does not intercept POST requests', () => {
    const worker = setupWorker()
    const event = worker.dispatch(new Request(`${origin}/subscribe/`, { method: 'POST' }))

    expect(event.response).toBeUndefined()
    expect(worker.fetch).not.toHaveBeenCalled()
  })

  test('leaves same-origin Range requests to the browser', () => {
    const worker = setupWorker()

    const event = worker.dispatch(new Request(new URL('/pdf/cv.pdf', origin), {
      headers: { Range: 'bytes=0-1023' }
    }))

    expect(event.response).toBeUndefined()
    expect(event.lifetime).toEqual([])
    expect(worker.fetch).not.toHaveBeenCalled()
  })

  test('bypasses a previously cached full response when a Range request arrives', () => {
    const worker = setupWorker()

    // A plain GET for the same URL was already cached as a full 200 response.
    worker.cache.match.mockResolvedValue(new Response('full pdf bytes'))

    const event = worker.dispatch(new Request(new URL('/pdf/cv.pdf', origin), {
      headers: { Range: 'bytes=0-1023' }
    }))

    expect(event.response).toBeUndefined()
    expect(worker.cache.match).not.toHaveBeenCalled()
  })

  test('serves fresh HTML for a cached page fetched through an ordinary GET', async () => {
    const worker = setupWorker()

    // The ClientRouter diffs route HTML through a plain fetch() (mode "cors"),
    // never "navigate" — this must still bypass a stale cached copy.
    worker.cache.match.mockResolvedValue(new Response('stale html'))
    worker.fetch.mockResolvedValue(new Response('fresh html'))

    const event = worker.dispatch(makeRequest('/posts/one/'))
    const response = await event.response

    expect(await response?.text()).toBe('fresh html')
    expect(worker.cache.match).not.toHaveBeenCalled()
    await Promise.all(event.lifetime)
    expect(await worker.cache.put.mock.calls[0]?.[1]?.text()).toBe('fresh html')
  })

  test('serves a cached page offline for an ordinary GET page request', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockResolvedValue(new Response('cached page'))

    const event = worker.dispatch(makeRequest('/posts/one/'))
    const response = await event.response

    expect(await response?.text()).toBe('cached page')
    await Promise.all(event.lifetime)
  })

  test('falls back to the offline document for an uncached page request without navigate mode', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockImplementation(request => Promise.resolve(
      request === '/offline/' ? new Response('Offline page') : undefined
    ))

    const event = worker.dispatch(makeRequest('/never-visited/'))
    const response = await event.response

    expect(await response?.text()).toBe('Offline page')
    await Promise.all(event.lifetime)
  })

  test.each([false, true])('preserves a fresh 404 page response instead of a cached page (navigation: %s)', async navigation => {
    const worker = setupWorker()

    worker.fetch.mockResolvedValue(new Response('Not Found', { status: 404 }))
    worker.cache.match.mockResolvedValue(new Response('cached page'))

    const event = worker.dispatch(makeRequest('/posts/one/', navigation))
    const response = await event.response

    expect(response?.status).toBe(404)
    expect(await response?.text()).toBe('Not Found')
    await Promise.all(event.lifetime)
    expect(worker.cache.put).not.toHaveBeenCalled()
  })

  test('preserves the query string on a network-first page request', async () => {
    const worker = setupWorker()

    worker.fetch.mockResolvedValue(new Response('tagged page'))

    const event = worker.dispatch(makeRequest('/posts/one/?tag=foo'))
    await event.response
    await Promise.all(event.lifetime)

    expect(worker.fetch).toHaveBeenCalledWith(expect.objectContaining({ url: `${origin}/posts/one/?tag=foo` }))
    expect(worker.cache.put.mock.calls[0]?.[0]?.url).toBe(`${origin}/posts/one/?tag=foo`)
  })

  test.each(['/search-index.json', '/pdf/cv.pdf', '/pdf/cv-full.pdf', '/feed.xml', '/feed.json', '/manifest.webmanifest'])(
    'serves the fresh network response for mutable resource %s', async path => {
      const worker = setupWorker()

      worker.cache.match.mockResolvedValue(new Response('stale json'))
      worker.fetch.mockResolvedValue(new Response('fresh json'))

      const event = worker.dispatch(makeRequest(path))
      const response = await event.response

      expect(await response?.text()).toBe('fresh json')
      await Promise.all(event.lifetime)
    }
  )

  test.each(['/search-index.json', '/pdf/cv.pdf', '/feed.xml'])(
    'uses only the matching resource offline, never HTML, for %s', async path => {
      const worker = setupWorker()

      worker.fetch.mockRejectedValue(new TypeError('Offline'))
      worker.cache.match.mockImplementation(request => Promise.resolve(
        request === '/offline/' ? new Response('Offline page') : undefined
      ))

      expect((await worker.dispatch(makeRequest(path)).response)?.type).toBe('error')
      expect(worker.cache.match).not.toHaveBeenCalledWith('/offline/')

      worker.cache.match.mockResolvedValue(new Response('cached resource'))

      expect(await (await worker.dispatch(makeRequest(path)).response)?.text()).toBe('cached resource')
    }
  )

  test('refreshes a PDF opened through browser navigation', async () => {
    const worker = setupWorker()

    worker.cache.match.mockResolvedValue(new Response('stale PDF'))
    worker.fetch.mockResolvedValue(new Response('fresh PDF', { headers: { 'Content-Type': 'application/pdf' } }))

    const response = await worker.dispatch(makeRequest('/pdf/cv.pdf', true)).response

    expect(await response?.text()).toBe('fresh PDF')
    expect(response?.headers.get('Content-Type')).toBe('application/pdf')
    expect(worker.cache.match).not.toHaveBeenCalled()
  })

  test.each([false, true])('never serves offline HTML for PDF navigation (cached PDF: %s)', async cached => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockImplementation(request => {
      if (request === '/offline/') return Promise.resolve(new Response('Offline page'))

      return Promise.resolve(cached ? new Response('cached PDF', { headers: { 'Content-Type': 'application/pdf' } }) : undefined)
    })

    const response = await worker.dispatch(makeRequest('/pdf/cv.pdf', true)).response

    expect(response?.type).toBe(cached ? 'default' : 'error')
    expect(await response?.text()).toBe(cached ? 'cached PDF' : '')
    expect(worker.cache.match).not.toHaveBeenCalledWith('/offline/')
  })

  test('evicts the oldest excess entries while retaining the offline shell', async () => {
    const worker = setupWorker()
    const assets = Array.from({ length: 258 }, (_, index) => makeRequest(`/_astro/file-${index}.js`))

    worker.cache.keys.mockResolvedValue([makeRequest('/offline/'), makeRequest('/'), ...assets])
    worker.fetch.mockResolvedValue(new Response('new asset'))

    const event = worker.dispatch(makeRequest('/_astro/new.js'))

    await event.response
    await Promise.all(event.lifetime)
    expect(worker.cache.delete.mock.calls.map(([request]) => request.url)).toEqual(
      assets.slice(0, 4).map(request => request.url)
    )
  })

  test('returns fresh data even when cache eviction fails', async () => {
    const worker = setupWorker()

    worker.cache.keys.mockRejectedValue(new Error('Unavailable storage'))
    worker.fetch.mockResolvedValue(new Response('fresh data'))

    expect(await (await worker.dispatch(makeRequest('/search-index.json')).response)?.text()).toBe('fresh data')
  })
})

describe('Immutable asset caching', () => {
  test('reuses cached hashed assets without fetching, rewriting, or enumerating the cache', async () => {
    const worker = setupWorker()

    worker.cache.match.mockResolvedValue(new Response('cached content'))
    const event = worker.dispatch(makeRequest('/_astro/app.abc123.js'))

    expect(await (await event.response)?.text()).toBe('cached content')
    await Promise.all(event.lifetime)
    expect(worker.fetch).not.toHaveBeenCalled()
    expect(worker.cache.put).not.toHaveBeenCalled()
    expect(worker.cache.keys).not.toHaveBeenCalled()
  })

  test('fetches and stores a new content hash independently', async () => {
    const worker = setupWorker()
    const request = makeRequest('/_astro/app.def456.js')

    worker.fetch.mockResolvedValue(new Response('new asset'))
    const event = worker.dispatch(request)

    expect(await (await event.response)?.text()).toBe('new asset')
    await Promise.all(event.lifetime)
    expect(worker.fetch).toHaveBeenCalledExactlyOnceWith(request)
    expect(worker.cache.put).toHaveBeenCalledTimes(1)
    expect(await worker.cache.put.mock.calls[0]?.[1].text()).toBe('new asset')
  })

  test.each(['open', 'match'] as const)('serves hashed assets when cache %s fails', async operation => {
    const worker = setupWorker()

    if (operation === 'open') worker.open.mockRejectedValue(new Error('Storage unavailable'))
    else worker.cache.match.mockRejectedValue(new Error('Read failed'))
    worker.fetch.mockResolvedValue(new Response('network asset'))
    const event = worker.dispatch(makeRequest('/_astro/app.abc123.js'))

    expect(await (await event.response)?.text()).toBe('network asset')
    await Promise.all(event.lifetime)
  })
})
