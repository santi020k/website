import AxeBuilder from '@axe-core/playwright'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const noteSelector = '[data-newsletter-handoff]'
const email = 'newsletter-preview@example.invalid'
const interceptProvider = async (context: BrowserContext) => {
  const requests: { method: string, body: string | null, url: string }[] = []
  await context.route('https://buttondown.com/**', async route => {
    const request = route.request()
    requests.push({ method: request.method(), body: request.postData(), url: request.url() })
    await route.fulfill({ body: '<p>Provider handoff fixture</p>', contentType: 'text/html' })
  })
  return requests
}
const submit = async (page: Page) => {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('[data-newsletter-email]').press('Enter')
  ])
  await popup.waitForLoadState('domcontentloaded')
  await popup.close()
}

test.use({ reducedMotion: 'reduce' })

for (const locale of ['en', 'es']) {
  const prefix = locale === 'es' ? '/es' : ''
  const idle = locale === 'es' ? 'Abre Buttondown en una nueva pestaña.' : 'Opens Buttondown in a new tab.'
  const sent = locale === 'es' ? 'Continúa en Buttondown en la nueva pestaña para completar tu suscripción.' : 'Continue on Buttondown in the new tab to finish signing up.'

  for (const path of ['/blog/', article]) {
    test(`${locale} ${path} explains native submission without claiming subscription success`, async ({ context, page }) => {
      const requests = await interceptProvider(context)
      await page.goto(`${prefix}${path}`)
      const note = page.locator(noteSelector)
      const field = page.locator('[data-newsletter-email]')
      const button = page.locator('[data-newsletter-submit]')
      await expect(note).toHaveText(idle)
      await expect(field).toHaveAccessibleDescription(idle)
      await expect(button).toHaveAccessibleDescription(idle)
      await expect(note).toHaveAttribute('aria-live', 'polite')
      await expect(note).toHaveAttribute('aria-atomic', 'true')
      await expect(note).toHaveAttribute('role', 'status')
      await field.fill(email)
      await submit(page)
      await expect(note).toHaveText(sent)
      await expect(note).toHaveAttribute('data-submitted', '')
      await expect(field).toHaveValue(email)
      await expect(field).toBeFocused()
      await expect(button).toBeEnabled()
      expect(requests).toHaveLength(1)
      expect(requests[0]?.method).toBe('POST')
      expect(requests[0]?.url).not.toContain('newsletter-preview')
      expect(requests[0]?.body).toContain('email=newsletter-preview%40example.invalid')
      expect(requests[0]?.body).toContain('embed=1')
      await field.fill('updated@example.invalid')
      await expect(note).toHaveText(idle)
      await expect(note).not.toHaveAttribute('data-submitted')
      await submit(page)
      await expect(note).toHaveText(sent)
      await page.locator('[data-newsletter-form]').evaluate(form => {
        if (!(form instanceof HTMLFormElement)) throw new Error('Expected newsletter form')
        form.reset()
      })
      await expect(note).toHaveText(idle)
      await expect(field).toBeEmpty()
      await expect(page.locator('[data-newsletter-rss]')).toHaveAttribute('href', '/feed.xml')
      await expect(page.locator('[data-newsletter-copy]')).toHaveAttribute('data-share-url', 'https://santi020k.com/feed.xml')
    })
  }

  test(`${locale} invalid or cancelled submission keeps the opening guidance`, async ({ context, page }) => {
    const requests = await interceptProvider(context)
    await page.goto(`${prefix}/blog/`)
    const note = page.locator(noteSelector)
    const field = page.locator('[data-newsletter-email]')
    const button = page.locator('[data-newsletter-submit]')
    const pages = context.pages().length
    await button.click()
    await expect(field).toBeFocused()
    await expect(note).toHaveText(idle)
    await field.fill('not-an-email')
    await button.click()
    await expect(note).toHaveText(idle)
    await expect(page.locator('[data-newsletter-form] input:invalid')).toHaveCount(1)
    await field.fill(email)
    await page.evaluate(() => {
      document.addEventListener('submit', event => {
        event.preventDefault()
      }, { once: true })
    })
    await button.click()
    await expect(note).toHaveText(idle)
    expect(context.pages()).toHaveLength(pages)
    expect(requests).toHaveLength(0)
  })
}

test('handoff survives article, blog, and Back navigation without duplicate submission', async ({ context, page }) => {
  const requests = await interceptProvider(context)
  await page.goto(article)
  await page.locator('[data-newsletter-email]').fill(email)
  await submit(page)
  await page.locator('[data-return-link]').click()
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await expect(page.locator('#newsletter-handoff-compact')).not.toHaveAttribute('data-submitted')
  await page.locator('#newsletter-email-compact').fill(email)
  await submit(page)
  await expect(page.locator('#newsletter-handoff-compact')).toHaveAttribute('data-submitted')
  await page.goBack()
  await expect(page).toHaveURL(article)
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await page.locator('#newsletter-email-article').fill(email)
  await submit(page)
  await expect(page.locator('#newsletter-handoff-article')).toHaveAttribute('data-submitted')
  expect(requests).toHaveLength(3)
})

test('handoff remains readable in both themes at narrow and enlarged text sizes', async ({ context, page }) => {
  await interceptProvider(context)
  await page.goto('/es/blog/')
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value
    }, theme)
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        await page.locator('[data-newsletter-email]').fill(email)
        await submit(page)
        await expect(page.locator(noteSelector)).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    expect((await new AxeBuilder({ page }).include('[data-newsletter]').analyze()).violations).toEqual([])
  }
})

test.describe('Newsletter handoff without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const prefix of ['', '/es']) {
    const idle = prefix ? 'Abre Buttondown en una nueva pestaña.' : 'Opens Buttondown in a new tab.'

    test(`native signup retains its explanation on ${prefix || 'English'}`, async ({ context, page }) => {
      const requests = await interceptProvider(context)
      await page.goto(`${prefix}${article}`)
      await expect(page.locator(noteSelector)).toHaveText(idle)
      await expect(page.locator('[data-newsletter-submit]')).toHaveAccessibleDescription(idle)
      await page.locator('[data-newsletter-email]').fill(email)
      await submit(page)
      expect(requests).toHaveLength(1)
      expect(requests[0]?.method).toBe('POST')
      await expect(page.locator(noteSelector)).toHaveText(idle)
      await expect(page.locator('[data-newsletter-rss]')).toBeVisible()
    })
  }
})
