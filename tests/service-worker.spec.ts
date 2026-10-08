import { expect, test } from '@playwright/test'

test('serves a partial PDF response after caching the complete file', async ({ page }) => {
  // A static text document avoids the site's intentional localhost worker cleanup.
  await page.goto('/robots.txt')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  const full = await page.evaluate(async () => {
    const response = await fetch('/pdf/cv.pdf')

    return { status: response.status, byteLength: (await response.arrayBuffer()).byteLength }
  })

  expect(full.status).toBe(200)
  expect(full.byteLength).toBeGreaterThan(64)

  const partial = await page.evaluate(async () => {
    const response = await fetch('/pdf/cv.pdf', { headers: { Range: 'bytes=0-63' } })

    return {
      status: response.status,
      contentRange: response.headers.get('content-range'),
      byteLength: (await response.arrayBuffer()).byteLength
    }
  })

  expect(partial.status).toBe(206)
  expect(partial.contentRange).toBe(`bytes 0-63/${full.byteLength}`)
  expect(partial.byteLength).toBe(64)
})

test('bypasses a stale cached page for an ordinary GET route fetch', async ({ page }) => {
  // A static text document avoids the site's intentional localhost worker cleanup.
  await page.goto('/robots.txt')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  // Seed the worker's own cache with a stale copy of the home page, the way a
  // prior visit would have left one behind.
  await page.evaluate(async () => {
    const cacheNames = await caches.keys()
    const staticCacheName = cacheNames.find(name => name.startsWith('santi020k-static-'))

    if (!staticCacheName) throw new Error('Service worker cache was not created')

    const cache = await caches.open(staticCacheName)

    await cache.put('/', new Response('<html>STALE_MARKER</html>', {
      headers: { 'content-type': 'text/html' }
    }))
  })

  // The Astro ClientRouter fetches route HTML through a plain fetch(), not a
  // navigation — this must still receive the live network response.
  const text = await page.evaluate(async () => (await fetch('/')).text())

  expect(text).not.toContain('STALE_MARKER')
})
