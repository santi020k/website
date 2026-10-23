// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { runInNewContext } from 'node:vm'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const source = readFileSync(resolvePath(process.cwd(), 'public/sw.js'), 'utf8')
const origin = 'https://santi020k.com'

const setupWorker = (assets: string[] = []) => {
  const handlers = new Map<string, (event: unknown) => void>()
  const cache = {
    addAll: vi.fn<(requests: string[]) => Promise<void>>().mockResolvedValue(undefined),
    delete: vi.fn<(request: Request) => Promise<boolean>>().mockResolvedValue(true),
    keys: vi.fn<() => Promise<Request[]>>().mockResolvedValue([]),
    match: vi.fn<(
      request: Request | string,
      options?: CacheQueryOptions
    ) => Promise<Response | undefined>>().mockResolvedValue(undefined),
    put: vi.fn<(request: Request, response: Response) => Promise<void>>().mockResolvedValue(undefined)
  }
  const open = vi.fn(() => Promise.resolve(cache))
  const fetch = vi.fn<typeof globalThis.fetch>()
  const skipWaiting = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

  runInNewContext(source.replace('const BUILD_ASSETS = []', `const BUILD_ASSETS = ${JSON.stringify(assets)}`), {
    Request,
    Response,
    URL,
    caches: { open },
    clearTimeout,
    fetch,
    setTimeout,
    self: {
      addEventListener: (type: string, handler: (event: unknown) => void) => handlers.set(type, handler),
      location: { origin },
      skipWaiting
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

  return { cache, dispatch, fetch, handlers, open, skipWaiting }
}

const makeRequest = (path: string, navigation = false) => {
  const request = new Request(new URL(path, origin))

  if (navigation) Object.defineProperty(request, 'mode', { value: 'navigate' })

  return request
}

describe('Service worker fetch handling', () => {
  test('installs the complete shell before activating', async () => {
    const worker = setupWorker(['/_astro/shell.js', '/_astro/style.css', '/_astro/font.woff2'])
    let installation: Promise<unknown> | undefined

    worker.handlers.get('install')?.({ waitUntil: (promise: Promise<unknown>) => {
      installation = promise
    } })
    await installation
    expect(worker.cache.addAll).toHaveBeenCalledWith(expect.arrayContaining([
      '/', '/offline/', '/_astro/shell.js', '/_astro/style.css', '/_astro/font.woff2'
    ]))
    expect(worker.skipWaiting).toHaveBeenCalledOnce()
  })

  test('does not activate an incomplete shell', async () => {
    const worker = setupWorker(['/_astro/shell.js'])
    let installation: Promise<unknown> | undefined

    worker.cache.addAll.mockRejectedValue(new Error('Asset unavailable'))
    worker.handlers.get('install')?.({ waitUntil: (promise: Promise<unknown>) => {
      installation = promise
    } })
    await expect(installation).rejects.toThrow('Asset unavailable')
    expect(worker.skipWaiting).not.toHaveBeenCalled()
  })

  test('keeps shell code when trimming runtime cache entries', async () => {
    const worker = setupWorker(['/_astro/shell.js'])

    worker.cache.keys.mockResolvedValue([
      makeRequest('/offline/'),
      makeRequest('/_astro/shell.js'),
      ...Array.from({ length: 257 }, (_, index) => makeRequest(`/_astro/old-${index}.js`))
    ])
    worker.fetch.mockResolvedValue(new Response('fresh'))

    const event = worker.dispatch(makeRequest('/search-index.json'))

    await event.response
    await Promise.all(event.lifetime)
    expect(worker.cache.delete.mock.calls.map(([request]) => new URL(request.url).pathname)).toEqual([
      '/_astro/old-0.js', '/_astro/old-1.js', '/_astro/old-2.js'
    ])
  })

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

  // Static pages render the same bytes for every query; `?q=` only selects client-side UI.
  test('reads a query page offline from its query-free cache key before the offline document', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockImplementation(request => {
      if (request === '/offline/') return Promise.resolve(new Response('Offline page'))

      return Promise.resolve(typeof request !== 'string' && request.url === `${origin}/` ? new Response('cached home') : undefined)
    })

    const { response } = worker.dispatch(makeRequest('/?q=Astro', true))

    expect(await (await response)?.text()).toBe('cached home')
    expect(worker.cache.match.mock.calls.map(([request, options]) => [typeof request === 'string' ? request : request.url, options]))
      .toEqual([[`${origin}/`, undefined]])
  })

  test.each([
    ['/?q=private-term', '/'],
    ['/?utm_source=newsletter&utm_medium=email', '/'],
    ['/blog/?page=2', '/blog/'],
    ['/posts/one/?tag=foo', '/posts/one/']
  ])('stores page %s once under its query-free URL while fetching the original', async (path, canonical) => {
    for (const navigation of [false, true]) {
      const worker = setupWorker()
      const request = makeRequest(path, navigation)

      worker.fetch.mockResolvedValue(new Response('page'))
      const event = worker.dispatch(request)

      expect(await (await event.response)?.text()).toBe('page')
      await Promise.all(event.lifetime)
      expect(worker.fetch).toHaveBeenCalledExactlyOnceWith(request)

      const [key] = worker.cache.put.mock.calls[0] ?? []

      expect(key?.url).toBe(`${origin}${canonical}`)
      expect(key?.method).toBe('GET')
      expect(key?.mode).not.toBe('navigate')
    }
  })

  test('keeps request headers on the query-free page key for Vary matching', async () => {
    const worker = setupWorker()
    const request = new Request(`${origin}/?q=Astro`, { headers: { Accept: 'text/html', 'Accept-Language': 'es' } })

    Object.defineProperty(request, 'mode', { value: 'navigate' })
    worker.fetch.mockResolvedValue(new Response('page'))
    const event = worker.dispatch(request)

    await event.response
    await Promise.all(event.lifetime)

    const [key] = worker.cache.put.mock.calls[0] ?? []

    expect(key?.headers.get('Accept')).toBe('text/html')
    expect(key?.headers.get('Accept-Language')).toBe('es')
  })

  test('stores a query-free page under the original request', async () => {
    const worker = setupWorker()
    const request = makeRequest('/blog/', true)

    worker.fetch.mockResolvedValue(new Response('page'))
    const event = worker.dispatch(request)

    await event.response
    await Promise.all(event.lifetime)
    expect(worker.cache.put.mock.calls[0]?.[0]).toBe(request)
  })

  test.each(['/search-index.json?v=2', '/feed.xml?v=2', '/pdf/cv.pdf?v=2', '/favicon.svg?v=2', '/_astro/app.abc123.js?v=2'])(
    'keeps the exact query key for non-page resource %s', async path => {
      const worker = setupWorker()
      const request = makeRequest(path)

      worker.fetch.mockResolvedValue(new Response('resource'))
      const event = worker.dispatch(request)

      await event.response
      await Promise.all(event.lifetime)
      expect(worker.cache.put.mock.calls[0]?.[0]).toBe(request)
    }
  )

  test.each(['/search-index.json?v=2', '/feed.xml?v=2', '/favicon.svg?v=2', '/_astro/app.abc123.js?v=2'])(
    'keeps exact query matching for non-page resource %s offline', async path => {
      const worker = setupWorker()
      const request = makeRequest(path)

      worker.fetch.mockRejectedValue(new TypeError('Offline'))

      const event = worker.dispatch(request)

      expect((await event.response)?.type).toBe('error')
      await Promise.all(event.lifetime)
      expect(worker.cache.match.mock.calls.every(([key, options]) => key === request && options === undefined))
        .toBe(true)
    }
  )

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

  test('sends the query string to the network for a page request', async () => {
    const worker = setupWorker()

    worker.fetch.mockResolvedValue(new Response('tagged page'))

    const event = worker.dispatch(makeRequest('/posts/one/?tag=foo'))
    await event.response
    await Promise.all(event.lifetime)

    expect(worker.fetch).toHaveBeenCalledWith(expect.objectContaining({ url: `${origin}/posts/one/?tag=foo` }))
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

  // Navigations use redirect mode "manual", so a cached followed redirect would
  // be rejected as a network error instead of reaching the offline document.
  test.each([
    ['/blog/retired-post/', false],
    ['/blog/retired-post/', true],
    ['/search-index.json', false],
    ['/favicon.svg', false],
    ['/_astro/app.abc123.js', false]
  ])('delivers but never caches a redirected response for %s (navigation: %s)', async (path, navigation) => {
    const worker = setupWorker()
    const redirected = new Response('destination')

    Object.defineProperty(redirected, 'redirected', { value: true })
    worker.fetch.mockResolvedValue(redirected)

    const event = worker.dispatch(makeRequest(path, navigation))

    expect(await (await event.response)?.text()).toBe('destination')
    await Promise.all(event.lifetime)
    expect(worker.cache.put).not.toHaveBeenCalled()
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

const deferredResponse = () => {
  let resolveResponse: (response: Response) => void = () => {
    throw new Error('Response promise not initialized')
  }
  let rejectResponse: (reason: Error) => void = () => {
    throw new Error('Response promise not initialized')
  }
  const promise = new Promise<Response>((resolve, reject) => {
    resolveResponse = resolve
    rejectResponse = reject
  })

  return { promise, resolve: resolveResponse, reject: rejectResponse }
}

describe('Service worker response-header deadline', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  test.each(['/', '/search-index.json', '/feed.xml', '/pdf/cv.pdf'])(
    'serves cached %s after eight seconds and refreshes it when the network recovers', async path => {
      const worker = setupWorker()
      const network = deferredResponse()
      let settled = false

      worker.fetch.mockReturnValue(network.promise)
      worker.cache.match.mockResolvedValue(new Response('cached response'))
      const event = worker.dispatch(makeRequest(path))

      void event.response?.then(() => {
        settled = true

        return undefined
      })
      await vi.advanceTimersByTimeAsync(7_999)
      expect(settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(settled).toBe(true)
      expect(await (await event.response)?.text()).toBe('cached response')
      expect(worker.cache.put).not.toHaveBeenCalled()

      network.resolve(new Response('late response'))
      await Promise.all(event.lifetime)
      expect(await worker.cache.put.mock.calls[0]?.[1].text()).toBe('late response')
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  test.each(['empty', 'unavailable', 'read failure'])('keeps waiting when cache storage is %s', async state => {
    const worker = setupWorker()
    const network = deferredResponse()
    let settled = false

    if (state === 'unavailable') worker.open.mockRejectedValue(new Error('Unavailable'))
    if (state === 'read failure') worker.cache.match.mockRejectedValue(new Error('Read failed'))
    worker.fetch.mockReturnValue(network.promise)
    const event = worker.dispatch(makeRequest('/fresh/', true))

    void event.response?.then(() => {
      settled = true

      return undefined
    })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(settled).toBe(false)
    network.resolve(new Response('late response'))
    expect(await (await event.response)?.text()).toBe('late response')
    await Promise.all(event.lifetime)
    expect(vi.getTimerCount()).toBe(0)
  })

  test.each([false, true])('reuses a query-free page at the deadline (navigation: %s)', async navigation => {
    const worker = setupWorker()
    const network = deferredResponse()
    let settled = false

    worker.fetch.mockReturnValue(network.promise)
    worker.cache.match.mockImplementation(request => Promise.resolve(
      typeof request !== 'string' && request.url === `${origin}/` ? new Response('cached home') : undefined
    ))
    const event = worker.dispatch(makeRequest('/?q=Astro', navigation))

    void event.response?.then(() => {
      settled = true

      return undefined
    })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(settled).toBe(true)
    expect(await (await event.response)?.text()).toBe('cached home')
    expect(worker.cache.match).toHaveBeenCalledOnce()
    network.reject(new TypeError('Offline'))
    await Promise.all(event.lifetime)
  })

  test('serves the offline document when a stalled page has never been cached', async () => {
    const worker = setupWorker()
    const network = deferredResponse()
    let settled = false

    worker.fetch.mockReturnValue(network.promise)
    worker.cache.match.mockImplementation(request => Promise.resolve(
      request === '/offline/' ? new Response('Offline page') : undefined
    ))
    const event = worker.dispatch(makeRequest('/new/', true))

    void event.response?.then(() => {
      settled = true

      return undefined
    })
    await vi.advanceTimersByTimeAsync(8_000)
    expect(settled).toBe(true)
    expect(await (await event.response)?.text()).toBe('Offline page')
    network.reject(new TypeError('Offline'))
    await Promise.all(event.lifetime)
  })

  test.each(['/search-index.json?v=2', '/feed.xml', '/pdf/cv.pdf'])(
    'never substitutes offline HTML for stalled %s', async path => {
      const worker = setupWorker()
      const network = deferredResponse()
      let settled = false

      worker.fetch.mockReturnValue(network.promise)
      worker.cache.match.mockImplementation(request => Promise.resolve(
        request === '/offline/' ? new Response('Offline page') : undefined
      ))
      const event = worker.dispatch(makeRequest(path))

      void event.response?.then(() => {
        settled = true

        return undefined
      })
      await vi.advanceTimersByTimeAsync(8_000)
      expect(settled).toBe(false)
      expect(worker.cache.match).toHaveBeenCalledExactlyOnceWith(expect.any(Request))
      network.reject(new TypeError('Offline'))
      expect((await event.response)?.type).toBe('error')
      await Promise.all(event.lifetime)
      expect(worker.cache.match.mock.calls.every(([request, options]) => request !== '/offline/' && !options)).toBe(true)
    }
  )

  test('returns fast network responses without reading cached copies', async () => {
    const worker = setupWorker()

    worker.fetch.mockResolvedValue(new Response('fresh'))
    const event = worker.dispatch(makeRequest('/'))

    expect(await (await event.response)?.text()).toBe('fresh')
    await Promise.all(event.lifetime)
    await vi.advanceTimersByTimeAsync(8_000)
    expect(worker.cache.match).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('clears the deadline when the network fails immediately', async () => {
    const worker = setupWorker()

    worker.fetch.mockRejectedValue(new TypeError('Offline'))
    worker.cache.match.mockResolvedValue(new Response('cached'))
    const event = worker.dispatch(makeRequest('/'))

    expect(await (await event.response)?.text()).toBe('cached')
    await Promise.all(event.lifetime)
    expect(vi.getTimerCount()).toBe(0)
  })

  test('does not interrupt a streaming body after response headers arrive', async () => {
    const worker = setupWorker()
    const stream = new TransformStream<Uint8Array, Uint8Array>()
    const writer = stream.writable.getWriter()

    worker.fetch.mockResolvedValue(new Response(stream.readable))
    const event = worker.dispatch(makeRequest('/pdf/cv.pdf'))
    const response = await event.response
    const body = response?.text()

    await vi.advanceTimersByTimeAsync(16_000)
    expect(vi.getTimerCount()).toBe(0)
    expect(worker.cache.match).not.toHaveBeenCalled()
    await writer.write(new TextEncoder().encode('complete download'))
    await writer.close()
    expect(await body).toBe('complete download')
    await Promise.all(event.lifetime)
  })
})
