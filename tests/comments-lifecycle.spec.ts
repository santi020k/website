import { expect, type Page, test } from '@playwright/test'

const LONG_POST_PATH = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

const openComments = async (page: Page) => {
  const fold = page.locator('[data-discussion-fold]')

  if (await fold.getAttribute('open') === null) await fold.locator('summary').click()
  await expect(fold).toHaveAttribute('open')
}

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

test('comments wait for disclosure activation, then load once with the current theme', async ({ page }) => {
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
  await page.locator('[data-discussion-summary]').focus()
  await expect(page.locator('#comments script')).toHaveCount(0)
  expect(requests).toBe(0)
  await openComments(page)
  await expect(page.locator('#comments script')).toHaveAttribute('data-theme', 'transparent_dark')
  await expect.poll(() => requests).toBe(1)
  await page.locator('#comments a').focus()
  await expect(page.locator('#comments script')).toHaveCount(1)
  expect(requests).toBe(1)
})

test('keyboard activation opens and closes the same discussion without a second request', async ({ page }) => {
  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1
    await route.fulfill({ contentType: 'application/javascript', body: `(${mockClient.toString()})()` })
  })
  await fulfillWidget(page)
  await page.goto(LONG_POST_PATH)
  const summary = page.locator('[data-discussion-summary]')

  await summary.focus()
  await expect(summary).toHaveCSS('outline-style', 'solid')
  await expect(page.locator('#comments script')).toHaveCount(0)
  await summary.press('Enter')
  await expect(page.frameLocator('iframe.giscus-frame').locator('body')).toHaveAttribute('data-theme')
  const frame = await page.locator('iframe.giscus-frame').elementHandle()

  await summary.press('Space')
  await expect(page.locator('[data-discussion-fold]')).not.toHaveAttribute('open')
  await expect(page.locator('iframe.giscus-frame')).toBeHidden()
  await expect(summary).toBeFocused()
  await summary.press('Enter')
  await expect(page.locator('iframe.giscus-frame')).toBeVisible()
  expect(await frame.evaluate(element => element.isConnected)).toBe(true)
  expect(requests).toBe(1)
})

test('comments activation does not depend on IntersectionObserver', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined })
  })
  await page.route('https://giscus.app/client.js', route => route.fulfill({
    contentType: 'application/javascript', body: ''
  }))
  await page.goto(await firstPostPath(page))
  await expect(page.locator('#comments script')).toHaveCount(0)
  await openComments(page)
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
  await openComments(page)
  await expect(page.locator('#comments script')).toHaveCount(1)
  await expect.poll(() => requests).toBe(1)
})

test('direct comments fragments and client navigation open the disclosure', async ({ page }) => {
  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1
    await route.fulfill({ contentType: 'application/javascript', body: `(${mockClient.toString()})()` })
  })
  await fulfillWidget(page)
  await page.goto(`${LONG_POST_PATH}#comments`)
  await expect(page.locator('[data-discussion-fold]')).toHaveAttribute('open')
  await expect(page.locator('iframe.giscus-frame')).toBeVisible()
  await expect(page.locator('[data-giscus-loading]')).toBeHidden()

  await returnToBlog(page)
  await expect(page).toHaveURL('/blog/')
  const path = await firstPostPath(page)
  // A native authored link exercises Astro's client-navigation boundary without
  // changing an already-initialized Lumen link's cached destination.
  await page.evaluate(href => {
    const link = document.createElement('a')

    link.href = href
    link.textContent = 'Open article comments'
    document.querySelector('main')?.appendChild(link)
  }, `${path}#comments`)
  await page.getByRole('link', { name: 'Open article comments', exact: true }).click()
  await expect(page).toHaveURL(`${path}#comments`)
  await expect(page.locator('[data-discussion-fold]')).toHaveAttribute('open')
  await expect(page.locator('iframe.giscus-frame')).toBeVisible()
  await expect.poll(() => requests).toBe(2)
})

test('a comments fragment on the current article opens the fold', async ({ page }) => {
  await page.route('https://giscus.app/client.js', route => route.fulfill({
    contentType: 'application/javascript', body: `(${mockClient.toString()})()`
  }))
  await fulfillWidget(page)
  await page.goto(LONG_POST_PATH)
  await page.evaluate(() => {
    const link = document.createElement('a')

    link.href = '#comments'
    link.textContent = 'Read article comments'
    document.querySelector('main')?.appendChild(link)
  })
  await page.getByRole('link', { name: 'Read article comments', exact: true }).click()
  await expect(page.locator('[data-discussion-fold]')).toHaveAttribute('open')
  await expect(page.locator('iframe.giscus-frame')).toBeVisible()
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
      await openComments(page)
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
      await openComments(page)

      const widget = page.frameLocator('iframe.giscus-frame').locator('body')

      await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')
      await page.locator('[data-theme-toggle-btn]').click()
      await expect(widget).toHaveAttribute('data-theme', 'light')
    } finally {
      release()
    }
  })
}

const fulfillWidget = (page: Page) => page.route('https://giscus.app/widget?*', route => route.fulfill({
  contentType: 'text/html', body: `<html><body><script>(${mockWidget.toString()})()</script></body></html>`
}))

test('a blocked comments client hides the mount and points readers to GitHub', async ({ page }) => {
  await page.route('https://giscus.app/client.js', route => route.abort())
  await page.goto(await firstPostPath(page))

  const section = page.getByRole('region', { name: 'Comments' })

  await expect(section.getByRole('heading', { level: 2, name: 'Comments' })).toBeVisible()
  await openComments(page)
  await expect(section.locator('script')).toHaveCount(1)
  await expect(section.locator('[data-giscus-mount]')).toBeHidden()

  const status = section.locator('[data-giscus-error]')

  await expect(status).toBeVisible()
  await expect(status).toHaveText(/could not load.*GitHub/iu)
  await expect(status).toHaveAttribute('role', 'status')
  await expect(status).toHaveAttribute('aria-live', 'polite')

  const github = section.getByRole('link', { name: 'Browse GitHub discussions', exact: true })

  await expect(github).toHaveAttribute('href', /^https:\/\/github\.com\/[^/]+\/[^/]+\/discussions$/u)
  await github.focus()
  await expect(github).toBeFocused()
})

test('returning to an article after a failed client makes a fresh, successful attempt', async ({ page }) => {
  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1

    if (requests === 1) {
      await route.abort()

      return
    }

    await route.fulfill({ contentType: 'application/javascript', body: `(${mockClient.toString()})()` })
  })
  await fulfillWidget(page)

  const path = await firstPostPath(page)

  await page.goto(path)
  await openComments(page)
  await expect(page.locator('#comments [data-giscus-error]')).not.toBeEmpty()

  await returnToBlog(page)
  await expect(page).toHaveURL('/blog/')
  await page.locator(`a[href="${path}"]`).first().click()
  await expect(page).toHaveURL(path)
  await openComments(page)
  await expect(page.locator('iframe.giscus-frame')).toHaveCount(1)
  await expect.poll(() => requests).toBe(2)
  await expect(page.locator('#comments [data-giscus-mount]')).toBeVisible()
  await expect(page.locator('#comments [data-giscus-error]')).toBeEmpty()
})

test('an error on an abandoned client leaves both article sections unchanged', async ({ page }) => {
  let requests = 0

  await page.route('https://giscus.app/client.js', async route => {
    requests += 1

    await route.fulfill({
      contentType: 'application/javascript',
      body: requests === 1 ?
        'document.currentScript.dataset.mockLoaded = "true"' :
        `(${mockClient.toString()})()`
    })
  })
  await fulfillWidget(page)

  const path = await firstPostPath(page)

  await page.goto(path)
  await openComments(page)
  await expect(page.locator('#comments script')).toHaveAttribute('data-mock-loaded', 'true')
  const abandonedScript = await page.locator('#comments script').elementHandle()

  await returnToBlog(page)
  await expect(page).toHaveURL('/blog/')
  await page.locator(`a[href="${path}"]`).first().click()
  await expect(page).toHaveURL(path)
  await openComments(page)
  await expect(page.locator('iframe.giscus-frame')).toHaveCount(1)

  // The browser can coalesce simultaneous script requests, so deliver the stale
  // event directly after the next client loads. The old mount has no frame.
  const abandonedState = await abandonedScript.evaluate(script => {
    const section = script.closest('#comments')

    script.dispatchEvent(new Event('error'))
    return {
      connected: script.isConnected,
      status: section?.querySelector('[data-giscus-error]')?.textContent
    }
  })

  expect(abandonedState).toEqual({ connected: false, status: '' })
  expect(requests).toBe(2)
  await expect(page.locator('#comments [data-giscus-mount]')).toBeVisible()
  await expect(page.locator('#comments [data-giscus-error]')).toBeEmpty()
})

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
  await openComments(page)

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
  await openComments(page)
  await expect(page.locator('#comments script')).toHaveCount(1)
  await expect(page.locator('iframe.giscus-frame')).toHaveCount(1)
  await expect(widget).toHaveAttribute('data-theme', 'transparent_dark')
  await page.locator('[data-theme-toggle-btn]').click()
  await expect(widget).toHaveAttribute('data-theme', 'light')
})
