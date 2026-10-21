const CACHE_VERSION = 'v4-cache-v2'
const STATIC_CACHE = `santi020k-static-${CACHE_VERSION}`
const MAX_CACHE_ENTRIES = 256

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

const coreURLs = new Set(CORE_ROUTES.map(route => new URL(route, self.location.origin).href))

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
  // Historical apps own their assets and never participate in the current cache.
  !/^\/v[1-9]\d*(?:\/|$)/.test(url.pathname) &&
  // Astro dev image pipeline — let the browser hit the dev server directly so
  // optimized images (e.g. search modal thumbnails) are not double-fetched via SW.
  !url.pathname.startsWith('/_image') &&
  // The Cache API has no concept of partial responses: cache.match() ignores
  // Range and returns a full 200 body, and cache.put() rejects a 206 outright.
  // Large same-origin files (e.g. the resume PDF) that browsers fetch in
  // byte ranges must go straight to the network instead of through the SW.
  !request.headers.has('Range')

// Every internal route is authored with a trailing slash (see AGENTS.md), and
// Astro emits one `index.html` per route under that convention. The
// ClientRouter fetches route HTML through a plain `fetch()` (mode "cors", not
// "navigate") to diff and swap the document, so it must receive the same
// network-first treatment as a real navigation — otherwise an in-page
// transition would silently swap in stale cached markup.
/** @param {URL} url */
const isPageRequest = url => url.pathname === '/' || url.pathname.endsWith('/')

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
    if (!cache) return

    await cache.put(request, response.clone())

    // Hashed assets change between deployments. Bound the cache without evicting
    // the small install-time offline shell or touching another app's storage.
    const keys = await cache.keys()
    const overflow = Math.max(0, keys.length - MAX_CACHE_ENTRIES)

    await Promise.all(keys.filter(key => !coreURLs.has(key.url)).slice(0, overflow)
      .map(key => cache.delete(key)))
  } catch {
    // Storage may be unavailable or full; the response is still usable.
  }
}

/**
 * @param {Request} request
 * @param {boolean} [pageFallback]
 */
const networkFirst = async (request, pageFallback = false) => {
  const cache = await openCache()

  try {
    const response = await fetch(request)

    if (response.ok) {
      await storeResponse(cache, request, response)
    }

    return response
  } catch {
    return (await matchCached(cache, request)) ??
      (pageFallback ? await matchCached(cache, '/offline/') : undefined) ?? Response.error()
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

  // Mutable downloads and data must honor their network revalidation policy.
  // Never substitute an HTML offline page for missing JSON, feeds, or PDF bytes.
  if (/\.(?:pdf|json|xml|webmanifest)$/.test(url.pathname)) {
    event.respondWith(networkFirst(event.request))

    return
  }

  if (event.request.mode === 'navigate' || isPageRequest(url)) {
    event.respondWith(networkFirst(event.request, true))

    return
  }

  const { response, revalidate } = staleWhileRevalidate(event.request)

  event.waitUntil(revalidate)

  event.respondWith(response)
})
