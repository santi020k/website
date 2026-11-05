// The production build fills these markers with current code/font URLs and a
// content fingerprint. Local development intentionally unregisters this worker.
/** @type {string[]} */
const BUILD_ASSETS = []
const BUILD_REVISION = 'development'
const CACHE_VERSION = `v5-cache-v1-${BUILD_REVISION}`
const STATIC_CACHE = `santi020k-static-${CACHE_VERSION}`
const MAX_CACHE_ENTRIES = 256
// Bounds only the wait for response headers. A response that has started keeps
// streaming its body without a deadline.
const NETWORK_HEADER_DEADLINE_MS = 8_000
const needsFollowedRedirectWorkaround = /\bFirefox\//.test(self.navigator.userAgent)

const CORE_ROUTES = [
  '/',
  '/es/',
  '/offline/',
  '/es/offline/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.webp',
  '/apple-touch-icon.webp',
  '/apple-touch-icon.png',
  '/icons/icon-192.webp',
  '/icons/icon-512.webp'
]

const precacheRoutes = [...CORE_ROUTES, ...BUILD_ASSETS]
const coreURLs = new Set(precacheRoutes.map(route => new URL(route, self.location.origin).href))

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(precacheRoutes)).then(() => self.skipWaiting())
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
  // Pagefind's entry module selects content-hashed fragments; let HTTP
  // revalidation keep the deployment coherent instead of returning a stale module.
  !url.pathname.startsWith('/pagefind/') &&
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

// Static pages render the same bytes for every query; `?q=` and campaign tags
// only select client-side UI. Store and read them under the query-free URL so
// variants share one copy and search terms never become cache keys. The
// network still receives the original URL. Data, feeds, PDFs, and assets keep
// their exact query because it can select different bytes.
/**
 * @param {Request} request
 * @param {URL} url
 * @returns {Request}
 */
const canonicalPageKey = (request, url) => {
  if (!url.search) return request

  const canonical = new URL(url)

  canonical.search = ''

  // Navigation requests cannot seed `new Request(url, request)`; copying only
  // the headers keeps Vary matching without carrying navigate mode or a body.
  return new Request(canonical.href, { headers: request.headers })
}

// Files, data, PDFs, and assets name an extension in their last path segment.
/** @param {URL} url */
const isFilePath = url => url.pathname.slice(url.pathname.lastIndexOf('/') + 1).includes('.')

// Legacy technology aliases such as `/technologies/Nest.js` are pages whose
// label contains a dot, so that route namespace keeps the offline document.
/** @param {URL} url */
const isPagePath = url => !isFilePath(url) || url.pathname.endsWith('.html') ||
  url.pathname.startsWith('/technologies/')

// A typed or externally shared `/about` still reaches the worker as a document
// navigation, while the site caches its trailing-slash route. On network failure
// or the header deadline, a path without a file extension may read the query-free
// `/about/` copy after its exact key misses. The address bar keeps
// the original URL; a synthesized redirect would wait on the network again.
/**
 * @param {Request} request
 * @param {URL} url
 * @returns {Request | undefined}
 */
const slashPageAlias = (request, url) => {
  if (request.mode !== 'navigate' || url.pathname.endsWith('/')) return undefined

  // Files, data, PDFs, and assets never resolve to a page alias.
  if (isFilePath(url)) return undefined

  const alias = new URL(url)

  alias.pathname = `${url.pathname}/`

  alias.search = ''

  return new Request(alias.href, { headers: request.headers })
}

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

    await cache.put(request, response)

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
 * @param {Request} [cacheKey]
 */
const fetchAndCache = (request, cacheKey = request) => {
  const cache = openCache()
  const response = fetch(request)

  // Clone before handing the response to the browser, then persist independently.
  // waitUntil keeps the worker alive without delaying HTML or download streaming.
  const revalidate = response.then(response => {
    // Browsers reject a cached followed redirect for navigations (redirect mode
    // "manual"), so storing one would turn an offline visit into a network error.
    if (!response.ok || response.redirected) return

    const copy = response.clone()

    return cache.then(cache => storeResponse(cache, cacheKey, copy))
  }).catch(() => undefined)

  return { cache, response, revalidate }
}

/**
 * @param {Request} request
 * @param {boolean} [pageFallback]
 * @param {Request} [cacheKey]
 */
const networkFirst = (request, pageFallback = false, cacheKey = request) => {
  const network = fetchAndCache(request, cacheKey)

  const matchFallback = async () => {
    const cache = await network.cache
    // Read only after the exact key misses, and never stored.
    const aliasKey = pageFallback ? slashPageAlias(request, new URL(request.url)) : undefined

    return (await matchCached(cache, cacheKey)) ??
      (aliasKey ? await matchCached(cache, aliasKey) : undefined) ??
      (pageFallback ?
        await matchCached(cache, /^\/es(?:\/|$)/.test(new URL(request.url).pathname) ?
          '/es/offline/' :
          '/offline/') :
        undefined)
  }

  // A connection can accept a request and never send headers. After the deadline,
  // answer with the cached resource, or the cached offline shell for pages. Only
  // when neither exists does the worker keep waiting for the network. The
  // request and its background cache write continue either way.
  /** @type {Promise<Response>} */
  const cachedAfterDeadline = new Promise(resolve => {
    const timer = setTimeout(() => {
      void matchFallback().then(cached => {
        if (cached) resolve(cached)

        return undefined
      })
    }, NETWORK_HEADER_DEADLINE_MS)

    const clear = () => clearTimeout(timer)

    void network.response.then(clear, clear)
  })

  return {
    response: Promise.race([
      network.response.then(result => {
        // Firefox can stall when a worker hands a page fetch an already-followed
        // redirect. Let the browser follow the same-origin destination itself.
        if (needsFollowedRedirectWorkaround && pageFallback && request.redirect === 'follow' && result.redirected &&
          result.url && new URL(result.url).origin === self.location.origin) {
          return Response.redirect(result.url)
        }

        return result
      }).catch(async () => (await matchFallback()) ?? Response.error()),
      cachedAfterDeadline
    ]),
    revalidate: network.revalidate
  }
}

/** @param {Request} request */
const staleWhileRevalidate = request => {
  const network = fetchAndCache(request)
  const cachedResponse = network.cache.then(cache => matchCached(cache, request))
  const freshResponse = network.response.catch(async () => (await cachedResponse) ?? Response.error())

  return {
    response: cachedResponse.then(cached => cached ?? freshResponse),
    revalidate: network.revalidate
  }
}

/** @param {Request} request */
const cacheFirst = request => {
  const result = openCache().then(async cache => {
    const cached = await matchCached(cache, request)

    return cached ? { response: cached, revalidate: Promise.resolve() } : networkFirst(request)
  })

  return {
    response: result.then(result => result.response),
    revalidate: result.then(result => result.revalidate)
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  if (!shouldHandleRequest(event.request, url)) {
    return
  }

  // Mutable downloads and data must honor their network revalidation policy.
  // Never substitute an HTML offline page for missing JSON, feeds, or PDF bytes.
  const mutableResource = /\.(?:pdf|json|xml|webmanifest)$/.test(url.pathname)
  const pageRequest = event.request.mode === 'navigate' || isPageRequest(url)
  const staticPage = !mutableResource && (isPageRequest(url) || (pageRequest && url.pathname.endsWith('.html')))
  const assetStrategy = url.pathname.startsWith('/_astro/') ? cacheFirst : staleWhileRevalidate

  // Every navigation stays network-first, but a file opened in a tab (robots.txt,
  // an image, an icon) falls back only to its own cached bytes, never to HTML.
  const { response, revalidate } = mutableResource || pageRequest ?
    networkFirst(
      event.request,
      pageRequest && !mutableResource && isPagePath(url),
      staticPage ? canonicalPageKey(event.request, url) : event.request
    ) :
    assetStrategy(event.request)

  event.waitUntil(revalidate)

  event.respondWith(response)
})
