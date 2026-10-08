import { expect, type Locator, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const routes = [
  '/',
  '/about/',
  '/work/',
  '/projects/',
  '/blog/',
  '/speaking/',
  '/portfolio/',
  '/resume/',
  '/travel/',
  '/developer-experience/',
  '/offline/',
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/portfolio/lumen-ui/',
  '/blog/astro-doctor-announcement/'
]

test('external links render with new-tab protection even without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL: requireValue(baseURL), javaScriptEnabled: false })
  const page = await context.newPage()

  try {
    for (const route of routes) {
      const response = await page.goto(route)
      expect(response?.status(), route).toBe(200)

      const offenders = await page.locator('a[href]').evaluateAll(links => links
        .filter(link => {
          const url = new URL(link.getAttribute('href') ?? '', location.href)

          return ['http:', 'https:'].includes(url.protocol) &&
            ![location.origin, 'https://santi020k.com'].includes(url.origin)
        })
        .filter(link => link.getAttribute('target') !== '_blank' ||
          !['noopener', 'noreferrer'].every(token => (link.getAttribute('rel') ?? '').split(/\s+/).includes(token)))
        .map(link => link.getAttribute('href')))

      expect(offenders, `${route} has external links without new-tab protection`).toEqual([])
    }
  } finally {
    await context.close()
  }
})

const activations = [
  { name: 'pointer', activate: async (_page: Page, profile: Locator) => profile.click() },
  { name: 'keyboard',
    activate: async (page: Page, profile: Locator) => {
      await profile.focus()
      await expect(profile).toBeFocused()
      await page.keyboard.press('Enter')
    } }
]

for (const { name: activation, activate } of activations) {
  test(`resume profile opens a separate tab with ${activation} activation`, async ({ page, context }) => {
    await context.route('https://github.com/santi020k', route => route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>External profile</title>'
    }))
    await page.goto('/resume/')
    const originalURL = page.url()
    const profile = page.locator('main').getByRole('link', { name: 'github.com/santi020k', exact: true })
    const openedPage = context.waitForEvent('page')

    await activate(page, profile)

    const popup = await openedPage
    await expect(popup).toHaveURL('https://github.com/santi020k')
    await expect(page).toHaveURL(originalURL)
    expect(await popup.evaluate(() => window.opener === null)).toBe(true)
    expect(await popup.evaluate(() => document.referrer)).toBe('')
    await popup.close()
  })
}

test('resume profiles retain new-tab behavior after client navigation', async ({ page }) => {
  await page.goto('/')
  await page.locator('footer').getByRole('link', { name: 'View resume', exact: true }).click()
  await expect(page).toHaveURL(/\/resume\/$/)

  for (const name of ['linkedin.com/in/santi020k', 'github.com/santi020k']) {
    const link = page.locator('main').getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /\bnoopener\b/)
    await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/)
  }

  await expect(page.locator('main').getByRole('link', { name: 'hi@santi020k.com', exact: true }))
    .not.toHaveAttribute('target', '_blank')
  await expect(page.getByRole('link', { name: 'Download two-page resume PDF' }))
    .toHaveAttribute('download', 'santiago-molina-resume.pdf')
})
