import { expect, test } from '@playwright/test'

import { createOfflinePreview } from './helpers/offline-preview'

test('a prefetched redirect does not break a later offline navigation', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL, { '/retired-page/': '/about/' })
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    const destination = await page.evaluate(async () => {
      const response = await fetch('/retired-page/')

      await response.text()

      return { redirected: response.redirected, path: new URL(response.url).pathname }
    })

    expect(destination).toEqual({ redirected: true, path: '/about/' })

    // A normal cache write gives the earlier background redirect write time to
    // settle too; otherwise the old worker could pass by losing that race.
    await page.evaluate(async () => {
      await fetch('/search-index.json')
    })
    await expect.poll(() => page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current worker cache')

      return Boolean(await (await caches.open(name)).match('/search-index.json'))
    })).toBe(true)

    server.setOnline(false)
    await page.goto('/retired-page/')
    await expect(page).toHaveTitle('Offline | santi020k')
    await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
  } finally {
    await context.close()
    await server.close()
  }
})

test('an offline deep link reuses its cached page and keeps the query', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL)
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await page.evaluate(async () => {
      await fetch('/search-index.json')
    })
    await expect.poll(() => page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current worker cache')

      const cache = await caches.open(name)

      return Boolean(await cache.match('/')) && Boolean(await cache.match('/search-index.json'))
    })).toBe(true)

    server.setOnline(false)
    await page.goto('/?q=Astro')
    await expect(page).not.toHaveTitle('Offline | santi020k')
    expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
    await expect(page.locator('#site-search-dialog')).toBeVisible()
    await expect(page.locator('#site-search-input')).toHaveValue('Astro')
    await expect(page.locator('[data-site-search-result]').first()).toBeVisible()

    // A page that was never cached still reaches the offline document.
    await page.goto('/about/?q=Astro')
    await expect(page).toHaveTitle('Offline | santi020k')
  } finally {
    await context.close()
    await server.close()
  }
})

test('an offline navigation without a trailing slash reuses its cached page', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL)
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await page.goto('/about/')
    const aboutTitle = await page.title()

    await expect.poll(() => page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current worker cache')

      return Boolean(await (await caches.open(name)).match('/about/'))
    })).toBe(true)

    server.setOnline(false)
    for (const path of ['/about', '/about?utm_source=bookmark']) {
      await page.goto(path)
      await expect(page).toHaveTitle(aboutTitle)
      await expect(page).toHaveURL(path)
      await expect(page.locator('main h1')).toBeVisible()
    }
  } finally {
    await context.close()
    await server.close()
  }
})

test('offline file navigations fail while dotted technology aliases retain page recovery', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL)
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

    server.setOnline(false)
    for (const path of ['/robots.txt', '/favicon.svg?uncached=1', '/_astro/uncached-preview.webp']) {
      const filePage = await context.newPage()

      try {
        await expect(filePage.goto(path)).rejects.toThrow()
      } finally {
        // A failed navigation can commit a browser error page after goto rejects.
        // Keep that navigation isolated from the page-recovery assertion below.
        await filePage.close()
      }
    }

    await page.goto('/technologies/Nest.js')
    await expect(page).toHaveTitle('Offline | santi020k')
    await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
  } finally {
    await context.close()
    await server.close()
  }
})

test('page query variants share one query-free cache entry and still work offline', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL, {}, { vary: 'Accept-Encoding, Accept-Language' })
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await page.evaluate(async () => {
      await fetch('/search-index.json')
    })
    await page.goto('/?q=private-term')
    await page.goto('/?utm_source=newsletter&utm_medium=email')
    // The later write gives the earlier background page writes time to settle.
    await page.goto('/about/?utm_source=newsletter')

    const readKeys = () => page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current worker cache')

      return (await (await caches.open(name)).keys()).map(request => request.url)
    })

    await expect.poll(async () => (await readKeys()).map(url => new URL(url).pathname)).toContain('/about/')

    const pageKeys = (await readKeys()).map(url => new URL(url)).filter(url => url.pathname.endsWith('/'))

    expect(pageKeys.filter(url => url.search !== '')).toEqual([])
    expect(pageKeys.filter(url => url.pathname === '/')).toHaveLength(1)

    server.setOnline(false)
    await page.goto('/?q=aaron')
    await expect(page).not.toHaveTitle('Offline | santi020k')
    expect(new URL(page.url()).searchParams.get('q')).toBe('aaron')
    await expect(page.locator('#site-search-input')).toHaveValue('aaron')
    await expect(page.locator('[data-site-search-result-title]').filter({ hasText: 'Why I Built Between Contractions' }))
      .toHaveCount(1)

    // Unlike the homepage, About only entered the cache through the query URL
    // above. Both query-bearing and plain navigations must match that runtime key.
    for (const path of ['/about/?q=other', '/about/']) {
      await page.goto(path)
      await expect(page).not.toHaveTitle('Offline | santi020k')
      await expect(page).toHaveURL(path)
      await expect(page.locator('main h1')).toBeVisible()
    }
  } finally {
    await context.close()
    await server.close()
  }
})

for (const width of [390, 1440]) {
  test(`first-visit offline recovery retains its assets after eviction at ${width}px`, async ({ browser, baseURL }) => {
    const server = await createOfflinePreview(baseURL)
    const context = await browser.newContext({
      baseURL: server.url, reducedMotion: 'reduce', viewport: { width, height: 900 }
    })

    try {
      const page = await context.newPage()

      await page.goto('/')
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready
      })
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

      const shellAssets = await page.evaluate(async () => {
        const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

        if (!name) throw new Error('Missing current worker cache')

        const cache = await caches.open(name)
        const assets = (await cache.keys()).filter(key => new URL(key.url).pathname.startsWith('/_astro/')).map(key => key.url)

        for (let index = 0; index < 270; index += 1) {
          await cache.put(`/_astro/old-${index}.js`, new Response('old asset'))
        }

        await fetch('/search-index.json')

        return assets
      })

      expect(shellAssets.length).toBeGreaterThan(0)
      await expect.poll(() => page.evaluate(async assets => {
        const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

        if (!name) throw new Error('Missing current worker cache')

        const cache = await caches.open(name)

        return {
          count: (await cache.keys()).length,
          retained: (await Promise.all(assets.map(asset => cache.match(asset)))).every(Boolean)
        }
      }, shellAssets)).toEqual({ count: 256, retained: true })

      // The WebKit driver blocks even an unconditional worker response under
      // context.setOffline(true). Drop real connections instead; no worker or
      // Cache API behavior is mocked. Connectivity events have their own suite.
      server.setOnline(false)
      await page.goto('/about/')
      await expect(page).toHaveTitle('Offline | santi020k')
      await page.evaluate(() => document.fonts.ready)
      expect(await page.locator('body').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Montserrat')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

      const retry = page.getByRole('button', { name: 'Try again', exact: true })

      await retry.focus()
      await expect(retry).toBeFocused()
      server.setOnline(true)
      await expect(page.locator('[data-connection-status]')).toHaveText('Your browser reports a connection. Try again to load the latest page.')
      await Promise.all([page.waitForEvent('load'), retry.press('Enter')])
      await expect(page).toHaveURL('/about/')
      await expect(page).not.toHaveTitle('Offline | santi020k')
      await expect(page.locator('main h1')).toBeVisible()
    } finally {
      await context.close()
      await server.close()
    }
  })
}

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
  await page.evaluate(async () => {
    const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

    if (!name) throw new Error('Missing current service worker cache')

    const cache = await caches.open(name)

    for (let index = 0; index < 270; index += 1) {
      await cache.put(`/_astro/old-${index}.js`, new Response('old build asset'))
    }

    await (await caches.open('unrelated-cache')).put('/private', new Response('untouched'))
    await fetch('/search-index.json')
  })

  await expect.poll(() => page.evaluate(async () => {
    const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

    if (!name) throw new Error('Missing current service worker cache')

    const cache = await caches.open(name)

    return {
      count: (await cache.keys()).length,
      offline: Boolean(await cache.match('/offline/')),
      unrelated: await (await (await caches.open('unrelated-cache')).match('/private'))?.text()
    }
  })).toEqual({ count: 256, offline: true, unrelated: 'untouched' })
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
    await caches.open('santi020k-static-v4-cache-v2')
    await caches.open('unrelated-cache')
    await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  const names = await page.evaluate(() => caches.keys())

  expect(names).not.toContain('santi020k-static-2026-04-21')
  expect(names.filter(name => name.startsWith('santi020k-static-'))).toEqual([
    expect.stringMatching(/^santi020k-static-v5-cache-v1-[a-f0-9]{16}$/u)
  ])
  expect(names).toContain('unrelated-cache')
})

test('a stalled connection serves a cached deep link and search index after the header deadline', async ({ browser, baseURL }) => {
  const server = await createOfflinePreview(baseURL)
  const context = await browser.newContext({ baseURL: server.url, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/')
    const homeTitle = await page.title()

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    await page.evaluate(async () => {
      await (await fetch('/search-index.json')).text()
    })
    await expect.poll(() => page.evaluate(async () => {
      const name = (await caches.keys()).find(key => key.startsWith('santi020k-static-'))

      if (!name) throw new Error('Missing current worker cache')

      const cache = await caches.open(name)

      return Boolean(await cache.match('/')) && Boolean(await cache.match('/search-index.json'))
    })).toBe(true)

    server.setStalled(true)
    const started = Date.now()

    await page.goto('/?q=Astro', { timeout: 18_000, waitUntil: 'domcontentloaded' })
    expect(Date.now() - started).toBeGreaterThanOrEqual(7_500)
    await expect(page).toHaveTitle(homeTitle)
    expect(new URL(page.url()).searchParams.get('q')).toBe('Astro')
    await expect(page.locator('#site-search-dialog')).toBeVisible()
    await expect(page.locator('#site-search-input')).toHaveValue('Astro')
    await expect(page.locator('[data-site-search-result]').first()).toBeVisible({ timeout: 12_000 })
    expect(server.heldRequestCount()).toBeGreaterThanOrEqual(2)
  } finally {
    await context.close()
    await server.close()
  }
})
