import { expect, test } from '@playwright/test'

import { createOfflinePreview } from '../helpers/offline-preview'

test('cached pages survive server errors while uncached errors and fresh 404s remain visible', async ({ browser, baseURL }) => {
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

    server.setResponseStatus(503)
    const cachedFetch = await page.evaluate(async () => {
      const response = await fetch('/about/?utm_source=outage')
      const document = new DOMParser().parseFromString(await response.text(), 'text/html')

      return { status: response.status, title: document.title }
    })

    expect(cachedFetch).toEqual({ status: 200, title: aboutTitle })

    const cachedNavigation = await page.goto('/about?utm_source=bookmark')

    expect(cachedNavigation?.status()).toBe(200)
    await expect(page).toHaveTitle(aboutTitle)
    await expect(page).toHaveURL('/about?utm_source=bookmark')
    await expect(page.locator('main h1')).toBeVisible()

    const uncachedFetch = await page.evaluate(async () => {
      const response = await fetch('/uncached-outage-preview/')

      return { status: response.status, body: await response.text() }
    })

    expect(uncachedFetch).toEqual({ status: 503, body: 'Preview response 503' })

    server.setResponseStatus(404)
    const notFound = await page.goto('/about/')

    expect(notFound?.status()).toBe(404)
    await expect(page.locator('body')).toHaveText('Preview response 404')

    server.setResponseStatus(undefined)
    const recovered = await page.goto('/about/')

    expect(recovered?.status()).toBe(200)
    await expect(page).toHaveTitle(aboutTitle)
  } finally {
    await context.close()
    await server.close()
  }
})
