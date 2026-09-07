/* eslint jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, type Page, test } from '@playwright/test'

const getFirstPostPath = async (page: Page): Promise<string> => {
  const response = await page.request.get('/feed.xml')
  const body = await response.text()
  const slugMatch = /<link>(https:\/\/[^<]+\/blog\/[^<]+\/)<\/link>/.exec(body)

  expect(slugMatch).not.toBeNull()

  const postUrl = slugMatch?.[1] ?? ''

  return new URL(postUrl).pathname
}

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

const stubShareRejection = async (page: Page, errorName: string): Promise<void> => {
  await page.addInitScript(name => {
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
      value: () => {
        window.localStorage.setItem('share-test-native-called', 'true')

        return Promise.reject(new DOMException('stubbed for test', name))
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
  }, errorName)
}

test.describe('Share buttons — native Web Share API path', () => {
  test('dismissing the native share sheet does not fall back to copying the link', async ({ page }) => {
    const path = await getFirstPostPath(page)

    await stubShareRejection(page, 'AbortError')
    await page.goto(path)

    const copyButton = page.locator('#copy-link-btn')
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('share-test-native-called'))).toBe('true')

    await expect(page.locator('#copy-label')).toHaveText('Copy link')
    await expect(copyButton).not.toHaveClass(/copied/)

    const clipboardProbe = await page.evaluate(() => window.localStorage.getItem('share-test-clipboard-write'))
    expect(clipboardProbe).toBeNull()
  })

  test('a non-cancellation share failure still falls back to copying the link', async ({ page }) => {
    const path = await getFirstPostPath(page)

    await stubShareRejection(page, 'NotAllowedError')
    await page.goto(path)

    const copyButton = page.locator('#copy-link-btn')
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    await expect(page.locator('#copy-label')).toHaveText(/Link copied!/i, { timeout: 4000 })

    const clipboardProbe = await page.evaluate(() => window.localStorage.getItem('share-test-clipboard-write'))
    expect(clipboardProbe).toBe(page.url())
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

  test('clicking the copy button writes the canonical URL to the clipboard', async ({ page }) => {
    const path = await getFirstPostPath(page)

    await page.goto(path)

    const copyButton = page.locator('#copy-link-btn')
    await expect(copyButton).toBeVisible()
    await copyButton.click()

    await expect(page.locator('#copy-label')).toHaveText(/Link copied!/i, { timeout: 4000 })

    const copied = await page.evaluate(() => window.localStorage.getItem('copy-test-value'))
    expect(copied).toContain(path)
  })
})
