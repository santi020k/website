const CACHE_VERSION = '2026-04-21'
const STATIC_CACHE = `santi020k-static-${CACHE_VERSION}`

const CORE_ROUTES = [
  '/',
  '/offline/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.webp',
  '/apple-touch-icon.webp',
  '/apple-touch-icon.png',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ROUTES)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames
        .filter(cacheName => cacheName.startsWith('santi020k-static-') && cacheName !== STATIC_CACHE)
        .map(cacheName => caches.delete(cacheName))
    )).then(() => self.clients.claim())
  )
})

const shouldHandleRequest = (request, url) => request.method === 'GET' &&
  url.origin === self.location.origin &&
  !url.pathname.startsWith('/_vercel/') &&
  !url.pathname.startsWith('/api/') &&
  // Astro dev image pipeline — let the browser hit the dev server directly so
  // optimized images (e.g. search modal thumbnails) are not double-fetched via SW.
  !url.pathname.startsWith('/_image')

// Cache storage is an optional optimization: failures must not discard network responses.
/** @returns {Promise<Cache | undefined>} */
const openCache = async () => {
  try {
    return await caches.open(STATIC_CACHE)
  } catch {
    return undefined
  }
}

/**
 * @param {Cache | undefined} cache
 * @param {Request | string} request
 */
const matchCached = async (cache, request) => {
  try {
    return await cache?.match(request)
  } catch {
    return undefined
  }
}

/**
 * @param {Cache | undefined} cache
 * @param {Request} request
 * @param {Response} response
 */
const storeResponse = async (cache, request, response) => {
  try {
    await cache?.put(request, response.clone())
  } catch {
    // Storage may be unavailable or full; the response is still usable.
  }
}

/** @param {Request} request */
const networkFirst = async request => {
  const cache = await openCache()

  try {
    const response = await fetch(request)

    if (response.ok) {
      await storeResponse(cache, request, response)
    }

    return response
  } catch {
    return (await matchCached(cache, request)) ??
      (await matchCached(cache, '/offline/')) ?? Response.error()
  }
}

/** @param {Request} request */
const staleWhileRevalidate = request => {
  const cachePromise = openCache()
  const cachedResponsePromise = cachePromise.then(cache => matchCached(cache, request))

  const networkResponsePromise = fetch(request)
    .then(async response => {
      if (response.ok) {
        await storeResponse(await cachePromise, request, response)
      }

      return response
    })
    .catch(async () => (await cachedResponsePromise) ?? Response.error())

  return {
    response: cachedResponsePromise.then(cachedResponse => cachedResponse ?? networkResponsePromise),
    revalidate: networkResponsePromise.then(() => undefined)
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (!shouldHandleRequest(event.request, url)) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request))

    return
  }

  const { response, revalidate } = staleWhileRevalidate(event.request)

  event.waitUntil(revalidate)

  event.respondWith(response)
})
