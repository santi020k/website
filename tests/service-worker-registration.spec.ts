import { expect, test } from '@playwright/test'

import { createOfflinePreview } from './helpers/offline-preview'

for (const hostname of ['localhost', '127.0.0.1', '[::1]'] as const) {
  test(`development on ${hostname} clears site caching without removing unrelated workers or storage`, async ({ browser, baseURL }) => {
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
      await storageOwner.evaluate(async () => {
        await (await caches.open('santi020k-static-old-development')).put('/old', new Response('old site data'))
        await (await caches.open('unrelated-cache')).put('/keep', new Response('unrelated data'))
      })

      expect(await storageOwner.evaluate(async () => (await (await caches.open('unrelated-cache')).match('/keep'))?.text())).toBe('unrelated data')

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
        caches: await caches.keys(),
        controlled: navigator.serviceWorker.controller !== null,
        preserved: await (await (await caches.open('unrelated-cache')).match('/keep'))?.text()
      }))).toEqual({ scopes: ['/other-app/'], caches: ['unrelated-cache'], controlled: false, preserved: 'unrelated data' })
    } finally {
      await context.close()
      await server.close()
    }
  })
}
