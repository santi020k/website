import { expect, test } from '@playwright/test'

import { createOfflinePreview } from './helpers/offline-preview'

// Firefox can allow registration on IPv6 loopback while denying page CacheStorage access.
const allowedCacheBodies = (browserName: string, hostname: string) => browserName === 'firefox' && hostname === '[::1]' ?
  ['unrelated data', null] :
  ['unrelated data']

for (const hostname of ['localhost', '127.0.0.1', '[::1]'] as const) {
  test(`development on ${hostname} clears site caching without removing unrelated workers or storage`, async ({ browser, browserName, baseURL }) => {
    const server = await createOfflinePreview(baseURL, {}, { hostname })
    const context = await browser.newContext({ baseURL: server.url })

    try {
      const storageOwner = await context.newPage()

      // A plain static document does not run the development cleanup script.
      await storageOwner.goto('/robots.txt')
      await storageOwner.evaluate(async () => {
        await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        await navigator.serviceWorker.register('/sw.js', { scope: '/other-app/' })
      })
      await expect.poll(() => storageOwner.evaluate(async () => {
        const registrations = await navigator.serviceWorker.getRegistrations()

        return registrations.length === 2 && registrations.every(registration => registration.active?.state === 'activated')
      })).toBe(true)
      const storedCacheBody = await storageOwner.evaluate(async () => {
        localStorage.setItem('unrelated-storage', 'unrelated data')
        try {
          await caches.keys()
        } catch (error) {
          if (error instanceof DOMException && error.name === 'SecurityError') return null

          throw error
        }

        await (await caches.open('santi020k-static-old-development')).put('/old', new Response('old site data'))
        await (await caches.open('unrelated-cache')).put('/keep', new Response('unrelated data'))

        return (await (await caches.open('unrelated-cache')).match('/keep'))?.text()
      })

      const cacheStorageAvailable = storedCacheBody !== null

      expect(allowedCacheBodies(browserName, hostname)).toContain(storedCacheBody)

      // Keep the unrelated app's document alive. WebKit drops these synthetic
      // cache bodies across document disposal even without site cleanup.
      const page = await context.newPage()

      await page.goto('/about/')
      await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map(registration => new URL(registration.scope).pathname))).toEqual(['/other-app/'])

      // Unregistering does not detach an already controlling worker. A new
      // document releases it and prevents pending fetches from repopulating storage.
      await page.goto('/')
      await expect.poll(() => page.evaluate(async () => ({
        scopes: (await navigator.serviceWorker.getRegistrations())
          .map(registration => new URL(registration.scope).pathname),
        controlled: navigator.serviceWorker.controller !== null,
        preserved: localStorage.getItem('unrelated-storage')
      }))).toEqual({ scopes: ['/other-app/'], controlled: false, preserved: 'unrelated data' })

      await expect.poll(() => page.evaluate(async available => available ?
        ({
          caches: await caches.keys(),
          preserved: await (await (await caches.open('unrelated-cache')).match('/keep'))?.text()
        }) :
        null, cacheStorageAvailable)).toEqual(cacheStorageAvailable ?
        { caches: ['unrelated-cache'], preserved: 'unrelated data' } :
        null)
    } finally {
      await context.close()
      await server.close()
    }
  })
}
