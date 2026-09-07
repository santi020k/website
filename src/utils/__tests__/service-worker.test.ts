import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, test, vi } from 'vitest'

const source = readFileSync(resolvePath(process.cwd(), 'public/sw.js'), 'utf8')
const origin = 'https://santi020k.com'

const setupWorker = () => {
  const handlers = new Map<string, (event: unknown) => void>()
  const cache = {
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

  test('keeps refreshing a cached asset after returning its cached response', async () => {
    const worker = setupWorker()
    let completeNetwork: (response: Response) => void = () => {
      throw new Error('Network request not initialized')
    }
    const network = new Promise<Response>(resolve => {
      completeNetwork = resolve
    })

    worker.cache.match.mockResolvedValue(new Response('cached asset'))
    worker.fetch.mockReturnValue(network)

    const event = worker.dispatch(makeRequest('/_astro/app.js'))

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
})
