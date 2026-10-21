import { expect, test } from '@playwright/test'

for (const path of ['/search-index.json', '/pdf/cv.pdf', '/feed.xml']) {
  test(`revalidates mutable resource ${path} before serving a previously cached copy`, async ({ page, request }) => {
    const expected = await request.get(path)
    const freshBytes = [...await expected.body()]

    await page.goto('/robots.txt')
    await page.evaluate(async resource => {
      await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current service worker cache')

      await (await caches.open(name)).put(resource, new Response('stale resource'))
    }, path)
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    const actual = await page.evaluate(async resource => {
      const response = await fetch(resource)

      return [...new Uint8Array(await response.arrayBuffer())]
    }, path)

    expect(actual).toEqual(freshBytes)
  })
}

test('bounds accumulated assets without evicting the offline page or unrelated storage', async ({ page }) => {
  await page.goto('/robots.txt')
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const result = await page.evaluate(async () => {
    const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

    if (!name) throw new Error('Missing current service worker cache')

    const cache = await caches.open(name)

    for (let index = 0; index < 270; index += 1) {
      await cache.put(`/_astro/old-${index}.js`, new Response('old build asset'))
    }

    await (await caches.open('unrelated-cache')).put('/private', new Response('untouched'))
    await fetch('/search-index.json')

    return {
      count: (await cache.keys()).length,
      offline: Boolean(await cache.match('/offline/')),
      unrelated: await (await (await caches.open('unrelated-cache')).match('/private'))?.text()
    }
  })

  expect(result).toEqual({ count: 256, offline: true, unrelated: 'untouched' })
})

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

test('retires the previous release cache while preserving unrelated caches', async ({ page }) => {
  await page.goto('/robots.txt')
  await page.evaluate(async () => {
    const previous = await caches.open('santi020k-static-2026-04-21')

    await previous.put('/', new Response('Previous release'))
    await caches.open('unrelated-cache')
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  const names = await page.evaluate(() => caches.keys())

  expect(names).not.toContain('santi020k-static-2026-04-21')
  expect(names).toContain('santi020k-static-v4-cache-v2')
  expect(names).toContain('unrelated-cache')
})
