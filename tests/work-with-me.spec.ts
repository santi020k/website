import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test.describe('Work with me', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/work-with-me/')
  })

  test('presents the five ways to help, results, and FAQ structured data', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Let’s work')

    for (const title of ['Tech talks and workshops', 'Engineering roles', 'Growing teams and companies', 'AI in everyday engineering', 'Code quality and developer experience']) {
      await expect(page.getByRole('heading', { level: 3, name: title, exact: true })).toBeVisible()
    }

    await expect(page.locator('[data-result]')).toHaveCount(3)
    const outcomeClaims = [
      { claim: '35% better system performance', href: '/portfolio/void/' },
      {
        claim: 'Marcone: Lighthouse score improved from 35 to 98',
        href: '/portfolio/smith-commerce/'
      },
      { claim: '40% better API performance', href: '/portfolio/optic-power/' }
    ]

    for (const { claim, href } of outcomeClaims) {
      await expect(page.locator(`[data-result][href="${href}"]`)).toHaveAccessibleDescription(claim)
    }

    await expect(page.getByRole('link', { name: 'Book a call' }).first()).toHaveAttribute('href', 'https://calendar.app.google/pQyPiv1yMViZUEcj8')

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()

    expect(schemas.some(schema => schema.includes('"FAQPage"'))).toBe(true)
  })

  for (const theme of ['light', 'dark']) {
    test(`has no accessibility violations in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/work-with-me/')
      await expect(page.locator('form[data-whatsapp-intake]')).toBeVisible()
      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }

  test('keeps the complete message available after opening WhatsApp', async ({ context, page }) => {
    const form = page.locator('form[data-whatsapp-intake]')

    await form.getByText('Using AI in engineering', { exact: true }).click()
    await form.getByLabel(/Your name/).fill('Ana')
    await form.getByLabel(/Company or event/).fill('Acme')
    await form.getByLabel(/A line of context/).fill('Team of 12.')

    const popupPromise = context.waitForEvent('page')

    await context.route('https://wa.me/**', route => route.fulfill({ body: 'ok', contentType: 'text/plain' }))
    await form.getByRole('button', { name: 'Open WhatsApp' }).click()

    const popup = await popupPromise
    const whatsapp = new URL(popup.url())

    expect(whatsapp.origin).toBe('https://wa.me')
    expect(whatsapp.pathname).toBe('/573507990136')
    expect(whatsapp.searchParams.get('text')).toBe('Hi Santiago, I’m Ana from Acme. I’d like help using AI in our engineering work. Team of 12.')

    await expect(page).toHaveURL(/\/work-with-me\/$/)
    await expect(form.getByLabel(/Your name/)).toHaveValue('Ana')
    await expect(form.getByLabel(/Company or event/)).toHaveValue('Acme')
    await expect(form.getByLabel(/A line of context/)).toHaveValue('Team of 12.')
    await expect(form.getByRole('status')).toHaveText('Your message is ready. Review it in WhatsApp, then press send.')
    await expect(form.getByRole('link', { name: 'Try WhatsApp again' })).toHaveAttribute('href', whatsapp.href)
    expect(await popup.evaluate(() => window.opener === null)).toBe(true)

    const browserState = await page.evaluate(() => JSON.stringify({
      history: history.state as unknown,
      local: Array.from({ length: localStorage.length }, (_, index) => {
        const key = localStorage.key(index)

        return key ? localStorage.getItem(key) : null
      }),
      session: Array.from({ length: sessionStorage.length }, (_, index) => {
        const key = sessionStorage.key(index)

        return key ? sessionStorage.getItem(key) : null
      }),
      url: location.href
    }))

    expect(browserState).not.toContain('Ana')
    expect(browserState).not.toContain('Acme')
    expect(browserState).not.toContain('Team of 12.')

    await form.getByLabel(/Your name/).fill('Ana & Luis')
    await form.getByLabel(/Company or event/).fill('R&D')
    await form.getByLabel(/A line of context/).fill('Review & delivery?\nNext month.')
    await form.getByText('Code quality and DX', { exact: true }).click()

    const retryPromise = context.waitForEvent('page')

    await form.getByRole('link', { name: 'Try WhatsApp again' }).click()

    const retried = await retryPromise

    await retried.waitForLoadState()
    expect(new URL(retried.url()).searchParams.get('text')).toBe('Hi Santiago, I’m Ana & Luis from R&D. I’d like help improving our code quality and developer experience. Review & delivery?\nNext month.')
  })

  test('offers a complete native retry when the scripted popup is blocked', async ({ context, page }) => {
    await page.evaluate(() => {
      window.open = () => null
    })
    await context.route('https://wa.me/**', route => route.fulfill({ body: 'ok', contentType: 'text/plain' }))

    const form = page.locator('form[data-whatsapp-intake]')

    await form.getByLabel(/Your name/).fill('Ana')
    await form.getByLabel(/A line of context/).fill('A workshop in November.')
    await form.getByRole('button', { name: 'Open WhatsApp' }).click()

    await expect(page).toHaveURL(/\/work-with-me\/$/)
    await expect(form.getByRole('status')).toBeVisible()
    expect(context.pages()).toHaveLength(1)

    const popupPromise = context.waitForEvent('page')

    await form.getByRole('link', { name: 'Try WhatsApp again' }).click()

    const popup = await popupPromise

    await popup.waitForLoadState()
    expect(new URL(popup.url()).searchParams.get('text')).toBe('Hi Santiago, I’m Ana. I’d like to invite you to give a talk or workshop. A workshop in November.')
  })

  test('keeps a direct WhatsApp link usable without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })

    try {
      const page = await context.newPage()

      await context.route('https://wa.me/**', route => route.fulfill({ body: 'ok', contentType: 'text/plain' }))
      await page.goto('/work-with-me/')
      await expect(page.locator('form[data-whatsapp-intake]')).toBeHidden()
      await expect(page.getByRole('button', { name: 'Open WhatsApp' })).toHaveCount(0)

      const popupPromise = context.waitForEvent('page')

      await page.getByRole('link', { name: 'Open WhatsApp directly', exact: true }).click()

      const popup = await popupPromise

      await popup.waitForLoadState()
      expect(new URL(popup.url()).origin).toBe('https://wa.me')
      await expect(page).toHaveURL(/\/work-with-me\/$/)
    } finally {
      await context.close()
    }
  })

  test('keeps the direct fallback when script execution is blocked', async ({ browser }) => {
    const context = await browser.newContext({ serviceWorkers: 'block' })

    try {
      await context.route('**/work-with-me/', async route => {
        const response = await route.fetch()

        await route.fulfill({
          headers: { ...response.headers(), 'content-security-policy': 'script-src \'none\'' },
          response
        })
      })

      const page = await context.newPage()

      await page.goto('/work-with-me/')
      await expect(page.locator('form[data-whatsapp-intake]')).toBeHidden()
      await expect(page.getByRole('link', { name: 'Open WhatsApp directly', exact: true })).toBeVisible()
    } finally {
      await context.close()
    }
  })

  test('initializes the intake after ClientRouter navigation', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-home-hero]').getByRole('link', { name: 'Work with me', exact: true }).click()
    await expect(page.locator('form[data-whatsapp-intake]')).toBeVisible()
    await expect(page.locator('[data-intake-fallback]')).toBeHidden()
    await page.locator('input[data-intake-name]').fill('Ana')
    await page.evaluate(() => {
      window.open = () => null
    })
    await page.getByRole('button', { name: 'Open WhatsApp' }).click()
    await expect(page.getByRole('status')).toContainText('Your message is ready.')
    await expect(page.getByRole('link', { name: 'Try WhatsApp again' })).toHaveAttribute('href', /Ana/)
  })

  test('direct visits to the retained handoff URL do not claim a message was opened or sent', async ({ page }) => {
    await page.goto('/work-with-me/sent/?topic=ai')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('main')).not.toContainText('WhatsApp opened')
    await expect(page.getByRole('link', { name: 'Write a message', exact: true })).toHaveAttribute('href', '/work-with-me/#start')
    await expect(page.locator('[data-sent-whatsapp]')).toBeVisible()
  })
})

for (const theme of ['light', 'dark'] as const) {
  const viewports = [
    { fontSize: 100, width: 390 },
    { fontSize: 100, width: 1440 },
    { fontSize: 200, width: 320 }
  ]

  for (const { fontSize, width } of viewports) {
    test(`contact composition stays usable at ${width}px and ${fontSize}% text in ${theme}`, async ({ context, page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize({ height: 1100, width })
      await page.goto('/work-with-me/')
      await page.evaluate(value => {
        document.documentElement.style.fontSize = `${value}%`
      }, fontSize)

      const navigation = page.getByRole('navigation', { name: 'On this page' })

      await expect(navigation.getByRole('link')).toHaveCount(3)
      await navigation.getByRole('link', { name: /Start a conversation/ }).click()
      await expect(page).toHaveURL(/#start$/)
      await expect(page.locator('#start')).toBeInViewport()

      const form = page.getByRole('form', { name: 'Message me on WhatsApp' })
      const talk = form.getByRole('radio', { name: 'A talk or workshop' })

      await talk.focus()
      await page.keyboard.press('ArrowRight')
      await expect(form.getByRole('radio', { name: 'An engineering role' })).toBeChecked()
      await form.getByLabel(/Your name/).fill('Ana')
      await form.getByLabel(/A line of context/).fill('An engineering role for our growing team.')
      await page.evaluate(() => {
        window.open = () => null
      })
      await form.getByRole('button', { name: 'Open WhatsApp' }).click()

      const retry = form.getByRole('link', { name: 'Try WhatsApp again' })

      await expect(retry).toHaveAttribute('href', /Ana/)
      await retry.focus()
      await expect(retry).toBeFocused()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

      for (const link of await page.locator('[data-contact-index] a, [data-intake-retry], [data-intake-submit]').all()) {
        const box = await link.boundingBox()

        expect(box?.height).toBeGreaterThanOrEqual(44)
      }

      await expectNoUnexpectedAccessibilityViolations(page)
      expect(context.pages()).toHaveLength(1)
    })
  }
}
