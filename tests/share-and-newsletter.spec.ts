import { expect, type Locator, type Page, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Comments loading, failure, and recovery have separate coverage. Here an
  // empty client keeps the reserved mount stable, so neither the provider nor
  // its error lifecycle shifts layout during share clicks. Nothing reaches the
  // network: the client is fulfilled locally and every other request aborts.
  await page.route('https://giscus.app/**', async route => {
    if (new URL(route.request().url()).pathname === '/client.js') {
      // The client is requested with crossorigin="anonymous", so it needs CORS
      // approval to load instead of firing the error lifecycle.
      await route.fulfill({
        body: '',
        contentType: 'text/javascript',
        headers: { 'access-control-allow-origin': '*' },
        status: 200
      })

      return
    }

    await route.abort()
  })
})

test.describe('Newsletter signup', () => {
  test('blog newsletter form points at the configured action and links to privacy', async ({ page }) => {
    await page.goto('/blog/')

    const form = page.locator('form[data-newsletter-form][action*="buttondown"]')
    const newsletter = form.locator('..')

    await expect(form).toHaveCount(1)
    await expect(form.locator('input[name="email"]')).toBeVisible()
    await expect(form.locator('input[name="email"]')).toHaveAttribute('autocomplete', /^email$/)
    await expect(form.locator('input[name="email"]')).toHaveAttribute('required', /^$/)
    await expect(form.getByRole('button', { name: /Get new posts/i })).toBeVisible()

    const privacyLink = newsletter.getByRole('link', { name: 'Privacy' })

    await expect(privacyLink).toHaveAttribute('href', /^\/privacy\/$/)
  })

  test('newsletter heading welcomes the wider writing topics', async ({ page }) => {
    await page.goto('/blog/')

    const heading = page.getByRole('heading', { name: 'New posts and discoveries' })

    await expect(heading).toBeVisible()
  })

  test('newsletter form submits a native POST carrying the email, without leaking it into the request URL', async ({ context, page }) => {
    await page.goto('/blog/')

    const form = page.locator('form[data-newsletter-form][action*="buttondown"]')

    // Progressive-enhancement contract: no JS intercepts this submit — Buttondown's
    // own embed pattern is a real cross-origin POST opened in a second tab.
    await expect(form).toHaveAttribute('method', /^post$/i)

    const seenRequests: { method: string, postData: string | null, url: string }[] = []

    await context.route('https://buttondown.com/**', async route => {
      seenRequests.push({
        method: route.request().method(),
        postData: route.request().postData(),
        url: route.request().url()
      })

      await route.fulfill({ body: '<html><body>Subscribed</body></html>', contentType: 'text/html', status: 200 })
    })

    await form.locator('input[name="email"]').fill('synthetic-audit-test@example.invalid')

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      form.getByRole('button', { name: /Get new posts/i }).click()
    ])

    await popup.waitForLoadState('domcontentloaded')
    await popup.close()

    expect(seenRequests).toHaveLength(1)

    const request = seenRequests[0]

    expect(request?.method).toBe('POST')
    expect(request?.url).not.toContain('synthetic-audit-test')
    expect(request?.postData ?? '').toContain('email=synthetic-audit-test%40example.invalid')
    expect(request?.postData ?? '').toContain('embed=1')
  })

  test('newsletter form blocks submission and opens no tab for an invalid email', async ({ context, page }) => {
    await page.goto('/blog/')

    let requestReachedProvider = false

    await context.route('https://buttondown.com/**', async route => {
      requestReachedProvider = true

      await route.abort()
    })

    const form = page.locator('form[data-newsletter-form][action*="buttondown"]')

    await form.locator('input[name="email"]').fill('not-an-email')

    const pagesBefore = context.pages().length

    await form.getByRole('button', { name: /Get new posts/i }).click()

    // Native constraint validation blocks the submit event before any navigation starts.
    expect(context.pages()).toHaveLength(pagesBefore)
    expect(requestReachedProvider).toBe(false)
    await expect(form.locator('input:invalid')).toHaveCount(1)
  })
})

// The public permalink the server renders for the first feed article. Share
// controls must emit exactly this URL even when the address bar carries
// tracking parameters, a fragment, or a local preview origin.
const getFirstPostPermalink = async (page: Page): Promise<{ path: string, permalink: string }> => {
  const response = await page.request.get('/feed.xml')
  const body = await response.text()
  const slugMatch = /<link>(https:\/\/[^<]+\/blog\/[^<]+\/)<\/link>/.exec(body)

  expect(slugMatch).not.toBeNull()

  const postUrl = new URL(slugMatch?.[1] ?? '')

  return { path: postUrl.pathname, permalink: new URL(postUrl.pathname, postUrl.origin).href }
}

const withNoise = (path: string): string => `${path}?utm_source=share-test#share-test-fragment`

const getReadyShareButton = async (page: Page): Promise<Locator> => {
  const button = page.locator('#copy-link-btn')

  // Scrolling near the toolbar also mounts the lazy comments client. Wait for
  // its initial space reservation before testing pointer activation.
  await button.scrollIntoViewIfNeeded()
  await expect(page.locator('#comments [data-giscus-mount] script')).toBeAttached()
  await expect(page.locator('#comments [data-giscus-error]')).toBeEmpty()

  return button
}

type NativeShareOutcome = 'AbortError' | 'NotAllowedError' | 'resolve'

const stubNativeShare = async (page: Page, outcome: NativeShareOutcome): Promise<void> => {
  await page.addInitScript(result => {
    const originalMatchMedia = window.matchMedia.bind(window)

    window.matchMedia = (query: string): MediaQueryList => {
      if (query !== '(pointer: coarse)') {
        return originalMatchMedia(query)
      }

      return {
        addEventListener: () => undefined,
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: true,
        media: query,
        onchange: null,
        removeEventListener: () => undefined,
        removeListener: () => undefined
      }
    }

    // `navigator.share` is defined via `Object.defineProperty` (not plain assignment)
    // because some engines expose it as a getter-only accessor on the prototype.
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        window.localStorage.setItem('share-test-native-called', 'true')

        window.localStorage.setItem('share-test-native-url', data.url ?? '')

        if (result === 'resolve') return Promise.resolve()

        return Promise.reject(new DOMException('stubbed for test', result))
      }
    })

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          window.localStorage.setItem('share-test-clipboard-write', text)

          return Promise.resolve()
        }
      }
    })
  }, outcome)
}

test.describe('Share buttons — native Web Share API path', () => {
  test('a successful native share sends the clean article permalink without copying', async ({ page }) => {
    const { path, permalink } = await getFirstPostPermalink(page)

    await stubNativeShare(page, 'resolve')
    await page.goto(withNoise(path))

    const copyButton = await getReadyShareButton(page)
    await expect(copyButton).toBeVisible()
    await expect(copyButton).toHaveAccessibleName('Share link')
    await expect(copyButton).toHaveAttribute('data-share-url', permalink)
    // The idle label swap to "Share link" must not reach the result live region.
    await expect(page.locator('#copy-status')).toBeEmpty()
    await copyButton.click()

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('share-test-native-url'))).toBe(permalink)

    await expect(page.locator('#copy-label')).toHaveText('Share link')
    await expect(copyButton).not.toHaveClass(/copied/)

    const clipboardProbe = await page.evaluate(() => window.localStorage.getItem('share-test-clipboard-write'))
    expect(clipboardProbe).toBeNull()
  })

  test('dismissing the native share sheet does not fall back to copying the link', async ({ page }) => {
    const { path, permalink } = await getFirstPostPermalink(page)

    await stubNativeShare(page, 'AbortError')
    await page.goto(withNoise(path))

    const copyButton = await getReadyShareButton(page)
    await expect(copyButton).toBeVisible()
    await expect(copyButton).toHaveAccessibleName('Share link')
    await copyButton.click()

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('share-test-native-called'))).toBe('true')
    expect(await page.evaluate(() => window.localStorage.getItem('share-test-native-url'))).toBe(permalink)

    // Once the operation settles, a cancelled share has announced nothing.
    await expect(copyButton).not.toHaveAttribute('aria-busy')
    await expect(page.locator('#copy-status')).toBeEmpty()
    await expect(page.locator('#copy-label')).toHaveText('Share link')
    await expect(copyButton).not.toHaveClass(/copied/)

    const clipboardProbe = await page.evaluate(() => window.localStorage.getItem('share-test-clipboard-write'))
    expect(clipboardProbe).toBeNull()
  })

  test('a non-cancellation share failure falls back to copying the clean permalink', async ({ page }) => {
    const { path, permalink } = await getFirstPostPermalink(page)

    await stubNativeShare(page, 'NotAllowedError')
    await page.goto(withNoise(path))

    const copyButton = await getReadyShareButton(page)
    await expect(copyButton).toBeVisible()
    await expect(copyButton).toHaveAccessibleName('Share link')
    await copyButton.click()

    await expect(page.locator('#copy-label')).toHaveText(/Link copied!/i, { timeout: 4000 })

    expect(await page.evaluate(() => window.localStorage.getItem('share-test-native-url'))).toBe(permalink)

    const clipboardProbe = await page.evaluate(() => window.localStorage.getItem('share-test-clipboard-write'))
    expect(clipboardProbe).toBe(permalink)
    await expect(page.locator('#copy-label')).toHaveText('Share link', { timeout: 6000 })
  })
})

test.describe('Share buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text: string) => {
            window.localStorage.setItem('copy-test-value', text)

            return Promise.resolve()
          }
        }
      })
    })
  })

  test('copied feedback has no animation when reduced motion is requested', async ({ page }) => {
    const { path } = await getFirstPostPermalink(page)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(path)

    const copyButton = await getReadyShareButton(page)

    await copyButton.click()
    await expect(page.locator('#copy-label')).toHaveText('Link copied!')
    await expect(page.locator('#copy-link-btn [data-check-icon]')).toHaveCSS('animation-name', 'none')
  })

  test('clicking the copy button writes the exact article permalink, ignoring query and fragment', async ({ page }) => {
    const { path, permalink } = await getFirstPostPermalink(page)

    await page.goto(withNoise(path))

    const copyButton = await getReadyShareButton(page)
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    await expect(page.locator('#copy-label')).toHaveText(/Link copied!/i, { timeout: 4000 })

    const copied = await page.evaluate(() => window.localStorage.getItem('copy-test-value'))
    expect(copied).toBe(permalink)

    // Matches the server-rendered social destinations exactly.
    await expect(page.getByRole('link', { name: 'Share on LinkedIn' }))
      .toHaveAttribute('href', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(permalink)}`)
  })

  test('a separate status region announces only the copy result and clears on reset', async ({ page }) => {
    const { path } = await getFirstPostPermalink(page)

    await page.clock.install()
    await page.goto(path)

    const copyButton = await getReadyShareButton(page)
    const status = page.locator('#copy-status')

    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))

    // DOM live-region semantics only; this does not exercise real screen reader speech.
    await expect(status).toHaveAttribute('role', 'status')
    await expect(status).toHaveAttribute('aria-live', 'polite')
    await expect(status).toHaveAttribute('aria-atomic', 'true')
    await expect(page.locator('#copy-label')).not.toHaveAttribute('aria-live')
    await expect(status).toBeEmpty()

    await copyButton.focus()
    await page.keyboard.press('Enter')

    // The visible label updates at once; the announcement lands in a later task.
    await expect(page.locator('#copy-label')).toHaveText('Link copied!')
    await expect(copyButton).toHaveAccessibleName('Link copied!')
    await expect(status).toBeEmpty()

    await page.clock.runFor(100)
    await expect(status).toHaveText('Link copied!')

    await page.clock.runFor(1899)
    await expect(status).toHaveText('Link copied!')

    await page.clock.runFor(1)
    await expect(status).toBeEmpty()
    await expect(copyButton).toHaveAccessibleName('Copy link')
    await expect(copyButton).toBeFocused()
  })
})

test.describe('Share buttons — clipboard failure', () => {
  test('a rejected clipboard write announces the failure instead of doing nothing', async ({ page }) => {
    const { path } = await getFirstPostPermalink(page)

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new DOMException('denied for test', 'NotAllowedError'))
        }
      })
    })

    await page.clock.install()
    await page.goto(path)

    const copyButton = await getReadyShareButton(page)
    const label = page.locator('#copy-label')
    const status = page.locator('#copy-status')

    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))

    await expect(copyButton).toBeVisible()
    await expect(status).toBeEmpty()
    await copyButton.focus()
    await page.keyboard.press('Enter')

    // The visible label stays short; the status region adds the recovery step.
    await expect(label).toHaveText('Copy failed')
    await expect(copyButton).toHaveAccessibleName('Copy failed')
    await expect(status).toBeEmpty()
    await expect(copyButton).toHaveClass(/copy-failed/)
    await expect(copyButton).not.toHaveClass(/(^|\s)copied(\s|$)/)

    await page.clock.runFor(100)
    await expect(status).toHaveText('Copy failed. Select and copy the address manually.')

    // State is transient: the control returns to its idle label without announcing it.
    await page.clock.runFor(1900)
    await expect(label).toHaveText('Copy link')
    await expect(status).toBeEmpty()
    await expect(copyButton).not.toHaveClass(/copy-failed/)
    await expect(copyButton).toBeFocused()
  })
})
