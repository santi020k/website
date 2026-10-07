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

    return { status: response.status, length: (await response.arrayBuffer()).byteLength }
  })

  expect(full.status).toBe(200)
  expect(full.length).toBeGreaterThan(64)

  const partial = await page.evaluate(async () => {
    const response = await fetch('/pdf/cv.pdf', { headers: { Range: 'bytes=0-63' } })

    return {
      status: response.status,
      contentRange: response.headers.get('content-range'),
      length: (await response.arrayBuffer()).byteLength
    }
  })

  expect(partial.status).toBe(206)
  expect(partial.contentRange).toBe(`bytes 0-63/${full.length}`)
  expect(partial.length).toBe(64)
})
