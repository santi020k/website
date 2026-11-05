import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const validEmail = 'recovery-test@example.invalid'

test.use({ reducedMotion: 'reduce' })

for (const prefix of ['', '/es']) {
  const required = prefix ? 'Ingresa tu correo electrónico para continuar.' : 'Enter your email address to continue.'
  const invalid = prefix ? 'Usa un correo electrónico como nombre@ejemplo.com.' : 'Use an email address like name@example.com.'

  for (const route of ['/blog/', article]) {
    test(`${prefix || 'English'} ${route} reveals email recovery only after invalid submission and permits correction`, async ({ context, page }) => {
      const requests: string[] = []
      await context.route('https://buttondown.com/**', async route => {
        requests.push(route.request().postData() ?? '')
        await route.fulfill({ body: '<p>Local signup fixture</p>', contentType: 'text/html' })
      })
      await page.goto(`${prefix}${route}`)
      const field = page.locator('[data-newsletter-email]')
      const error = page.locator('[data-newsletter-error]')
      const button = page.locator('[data-newsletter-submit]')
      const form = page.locator('[data-newsletter-form]')
      const openingDescription = await field.getAttribute('aria-describedby')
      await expect(form).toHaveJSProperty('noValidate', false)
      await expect(error).toBeHidden()
      await expect(field).not.toHaveAttribute('aria-invalid')
      await button.click()
      await expect(error).toHaveText(required)
      await expect(error).toBeVisible()
      await expect(error).toHaveAttribute('role', 'alert')
      await expect(error).toHaveAttribute('aria-atomic', 'true')
      await expect(field).toBeFocused()
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(field).toHaveAccessibleDescription(new RegExp(required))
      await expect(page.locator('[data-newsletter-handoff]')).not.toHaveAttribute('data-submitted')
      await button.focus()
      await expect(error).toBeVisible()
      await field.fill('reader@')
      await expect(error).toBeHidden()
      await expect(field).not.toHaveAttribute('aria-invalid')
      await expect(field).toHaveAttribute('aria-describedby', openingDescription ?? '')
      await field.press('Enter')
      await expect(error).toHaveText(invalid)
      await expect(error).toBeVisible()
      await expect(field).toHaveValue('reader@')
      await expect(field).toBeFocused()
      expect(requests).toHaveLength(0)
      expect(context.pages()).toHaveLength(1)

      // Autofill/programmatic changes may not emit input; successful validation
      // must still clear stale feedback before the native POST.
      await field.evaluate((element, value) => {
        if (!(element instanceof HTMLInputElement)) throw new Error('Expected email input')
        element.value = value
      }, validEmail)
      const [popup] = await Promise.all([page.waitForEvent('popup'), field.press('Enter')])
      await popup.waitForLoadState('domcontentloaded')
      await popup.close()
      await expect(error).toBeHidden()
      await expect(field).not.toHaveAttribute('aria-invalid')
      await expect(field).toHaveAttribute('aria-describedby', openingDescription ?? '')
      await expect(page.locator('[data-newsletter-handoff]')).toHaveAttribute('data-submitted')
      expect(requests).toHaveLength(1)
      expect(requests[0]).toContain('email=recovery-test%40example.invalid')
      await field.fill('reader@')
      await button.click()
      await expect(error).toBeVisible()
      await form.evaluate(element => {
        if (!(element instanceof HTMLFormElement)) throw new Error('Expected signup form')
        element.reset()
      })
      await expect(error).toBeHidden()
      await expect(field).not.toHaveAttribute('aria-invalid')
      await expect(field).toBeEmpty()
    })
  }
}

test('email recovery has no detected card accessibility violations and keeps the submit button aligned', async ({ page }) => {
  await page.goto('/es/blog/')
  const error = page.locator('[data-newsletter-error]')
  const field = page.locator('[data-newsletter-email]')
  const button = page.locator('[data-newsletter-submit]')
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
        await field.fill('reader@')
        await button.click()
        await expect(error).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    expect((await new AxeBuilder({ page }).include('[data-newsletter]').analyze()).violations).toEqual([])
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '100%'
  })
  const fieldBox = await field.boundingBox()
  const buttonBox = await button.boundingBox()
  expect(fieldBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect(Math.abs((fieldBox?.y ?? 0) - (buttonBox?.y ?? 1))).toBeLessThan(1)
  expect(Math.abs((fieldBox?.height ?? 0) - (buttonBox?.height ?? 1))).toBeLessThan(1)
})

test('email recovery resets on route swaps and remains bound after Back', async ({ page }) => {
  await page.goto(article)
  await page.locator('[data-newsletter-submit]').click()
  await expect(page.locator('[data-newsletter-error]')).toBeVisible()
  await page.locator('[data-return-link]').click()
  await expect(page).toHaveURL('/blog/')
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await expect(page.locator('#newsletter-error-compact')).toBeHidden()
  await page.locator('[data-newsletter-submit]').click()
  await expect(page.locator('#newsletter-error-compact')).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(article)
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await expect(page.locator('#newsletter-error-article')).toBeHidden()
  await page.locator('[data-newsletter-submit]').click()
  await expect(page.locator('#newsletter-error-article')).toBeVisible()
  await expect(page.locator('[data-newsletter-error]:visible')).toHaveCount(1)
})

test.describe('Email recovery without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const prefix of ['', '/es']) {
    test(`${prefix || 'English'} retains native constraint validation`, async ({ context, page }) => {
      const requests: string[] = []
      await context.route('https://buttondown.com/**', async route => {
        requests.push(route.request().url())
        await route.abort()
      })
      await page.goto(`${prefix}${article}`)
      const field = page.locator('[data-newsletter-email]')
      await page.locator('[data-newsletter-submit]').click()
      await expect(field).toBeFocused()
      await expect(page.locator('[data-newsletter-error]')).toBeHidden()
      await expect(page.locator('[data-newsletter-form] input:invalid')).toHaveCount(1)
      expect(requests).toHaveLength(0)
      expect(context.pages()).toHaveLength(1)
      await expect(page.locator('[data-newsletter-rss]')).toBeVisible()
    })
  }
})
