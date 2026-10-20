import { expect, type Page, test } from '@playwright/test'

const LONG_POST_PATH = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

const returnToBlog = async (page: Page) => {
  const menuToggle = page.locator('[data-mobile-nav-toggle]')

  if (await menuToggle.isVisible()) await menuToggle.click()
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('link', { name: 'Blog', exact: true }).click()
}

// Model the public Giscus client/widget boundary without contacting GitHub or
// loading real discussions. The widget announces readiness through its resize
// message and accepts the documented setConfig theme message.
const mockClient = () => {
  const script = document.currentScript

  if (!(script instanceof HTMLScriptElement)) throw new Error('Missing Giscus script')

  const iframe = document.createElement('iframe')
  const url = new URL('https://giscus.app/widget')

  url.searchParams.set('theme', script.dataset.theme ?? '')
  iframe.className = 'giscus-frame'
  iframe.title = 'Comments'
  iframe.loading = 'lazy'
  iframe.src = url.href
  script.after(iframe)
}

const mockWidget = () => {
  document.body.dataset.theme = new URL(window.location.href).searchParams.get('theme') ?? ''
  document.body.dataset.load = new URL(window.location.href).searchParams.get('reload') ?? ''

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    const data = event.data

    if (typeof data !== 'object' || data === null || !('giscus' in data)) return

    const giscus = data.giscus

    if (typeof giscus !== 'object' || giscus === null || !('setConfig' in giscus)) return

    const config = giscus.setConfig

    if (typeof config !== 'object' || config === null || !('theme' in config) || typeof config.theme !== 'string') return

    document.body.dataset.theme = config.theme
  })

  window.parent.postMessage({ giscus: { resizeHeight: 300 } }, new URL(document.referrer).origin)
}

const firstPostPath = async (page: Page) => {
  const response = await page.request.get('/feed.xml')
  const match = /<link>(https:\/\/[^<]+\/blog\/[^<]+\/)<\/link>/u.exec(await response.text())

  if (!match?.[1]) throw new Error('Missing feed article')

  return new URL(match[1]).pathname
}

test('comments wait for the reader, then load once with the current theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1

    await route.fulfill({ contentType: 'application/javascript', body: '' })
  })
  await page.goto(LONG_POST_PATH)
  await expect(page.locator('#comments')).toBeAttached()
  await expect(page.locator('#comments script')).toHaveCount(0)
  await page.locator('[data-theme-toggle-btn]').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('#comments script')).toHaveCount(0)
  expect(requests).toBe(0)

  await page.locator('#comments').scrollIntoViewIfNeeded()
  await expect(page.locator('#comments script')).toHaveAttribute('data-theme', 'transparent_dark')
  await expect.poll(() => requests).toBe(1)
  await page.locator('#comments a').focus()
  await expect(page.locator('#comments script')).toHaveCount(1)
  expect(requests).toBe(1)
})

test('keyboard focus loads comments even before an intersection callback', async ({ page }) => {
  // Keep observation pending to isolate the keyboard fallback from scrolling.
  await page.addInitScript(() => {
    IntersectionObserver.prototype.observe = () => undefined
  })
  await page.route('https://giscus.app/client.js', route => route.fulfill({
    contentType: 'application/javascript', body: ''
  }))
  await page.goto(await firstPostPath(page))
  await expect(page.locator('#comments script')).toHaveCount(0)
  await page.locator('#comments a').focus()
  await expect(page.locator('#comments script')).toHaveCount(1)
})

test('comments still load when IntersectionObserver is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined })
  })
  await page.route('https://giscus.app/client.js', route => route.fulfill({
    contentType: 'application/javascript', body: ''
  }))
  await page.goto(await firstPostPath(page))
  await expect(page.locator('#comments script')).toHaveCount(1)
})

test('leaving an unread article cancels pending comments and returning can load them', async ({ page }) => {
  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1

    await route.fulfill({ contentType: 'application/javascript', body: '' })
  })

  const path = LONG_POST_PATH

  await page.goto(path)
  await expect(page.locator('#comments script')).toHaveCount(0)
  await returnToBlog(page)
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator('#comments')).toHaveCount(0)
  expect(requests).toBe(0)
  await page.goBack()
  await expect(page).toHaveURL(path)
  await page.locator('#comments').scrollIntoViewIfNeeded()
  await expect(page.locator('#comments script')).toHaveCount(1)
  await expect.poll(() => requests).toBe(1)
})

const delayedResources = [
  { delayedResource: 'client', beforeToggle: (_page: Page) => Promise.resolve() },
  { delayedResource: 'widget', beforeToggle: async (page: Page) => expect(page.locator('iframe.giscus-frame')).toHaveCount(1) }
]

for (const { delayedResource, beforeToggle } of delayedResources) {
  test(`comments use the latest theme when the ${delayedResource} loads late`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })

    let release: () => void = () => undefined
    const pending = new Promise<void>(resolve => {
      release = resolve
    })

    await page.route('https://giscus.app/client.js', async route => {
      if (delayedResource === 'client') await pending

      await route.fulfill({ contentType: 'application/javascript', body: `(${mockClient.toString()})()` })
    })
    await page.route('https://giscus.app/widget?*', async route => {
      if (delayedResource === 'widget') await pending

      await route.fulfill({ contentType: 'text/html', body: `<html><body><script>(${mockWidget.toString()})()</script></body></html>` })
    })

    try {
      await page.goto(await firstPostPath(page), { waitUntil: 'domcontentloaded' })
      await page.locator('#comments').scrollIntoViewIfNeeded()
      await expect(page.locator('#comments script')).toHaveCount(1)

      await beforeToggle(page)

      await page.locator('[data-theme-toggle-btn]').click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(page.locator('#comments script')).toHaveAttribute('data-theme', 'transparent_dark')

      await page.evaluate(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://giscus.app', source: window, data: { giscus: { resizeHeight: 300 } }
        }))
      })

      release()
      await page.locator('#comments').scrollIntoViewIfNeeded()

      const widget = page.frameLocator('iframe.giscus-frame').locator('body')

      await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')
      await page.locator('[data-theme-toggle-btn]').click()
      await expect(widget).toHaveAttribute('data-theme', 'light')
    } finally {
      release()
    }
  })
}

test('comments mount once and retain live theme changes after article navigation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.route('https://giscus.app/client.js', route => route.fulfill({
    contentType: 'application/javascript', body: `(${mockClient.toString()})()`
  }))
  await page.route('https://giscus.app/widget?*', route => route.fulfill({
    contentType: 'text/html', body: `<html><body><script>(${mockWidget.toString()})()</script></body></html>`
  }))

  const path = await firstPostPath(page)

  await page.goto(path)
  await page.locator('#comments').scrollIntoViewIfNeeded()

  const widget = page.frameLocator('iframe.giscus-frame').locator('body')

  await expect(widget).toHaveAttribute('data-theme', 'light')
  await page.locator('[data-theme-toggle-btn]').click()
  await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')

  // Giscus reloads this same browsing context when signing out. Its original
  // iframe URL still contains the old light theme, so it must resynchronize.
  await page.locator('iframe.giscus-frame').evaluate(frame => {
    if (!(frame instanceof HTMLIFrameElement)) throw new Error('Missing comments frame')

    const url = new URL(frame.src)

    url.searchParams.set('reload', '1')
    frame.src = url.href
  })
  await expect(widget).toHaveAttribute('data-load', '1')
  await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')

  await returnToBlog(page)
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator('#comments')).toHaveCount(0)
  await page.locator(`a[href="${path}"]`).first().click()
  await expect(page).toHaveURL(path)
  await page.locator('#comments').scrollIntoViewIfNeeded()
  await expect(page.locator('#comments script')).toHaveCount(1)
  await expect(page.locator('iframe.giscus-frame')).toHaveCount(1)
  await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')
  await page.locator('[data-theme-toggle-btn]').click()
  await expect(widget).toHaveAttribute('data-theme', 'light')
})
