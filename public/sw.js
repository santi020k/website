const CACHE_VERSION = '2026-04-03'
const STATIC_CACHE = `santi020k-static-${CACHE_VERSION}`

const CORE_ROUTES = [
  '/',
  '/offline/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
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
  !url.pathname.startsWith('/api/')

const networkFirst = async request => {
  const cache = await caches.open(STATIC_CACHE)

  try {
    const response = await fetch(request)

    if (response.ok) {
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    return (await cache.match(request)) ?? (await cache.match('/offline/'))
  }
}

const staleWhileRevalidate = async request => {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  const networkResponsePromise = fetch(request)
    .then(async response => {
      if (response.ok) {
        await cache.put(request, response.clone())
      }

      return response
    })
    .catch(() => cachedResponse)

  return cachedResponse ?? networkResponsePromise
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

  event.respondWith(staleWhileRevalidate(event.request))
})
