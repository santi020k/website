import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark']) {
  test(`history works on desktop and mobile in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/history/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A website,over time.')
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://santi020k.com/history/')
    await expect(page.locator('.history-era')).toHaveCount(4)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const navbar = await page.locator('[data-header-frame]').evaluate(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      })
      const hero = await page.locator('.history-intro').evaluate(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      })
      expect(hero.x).toBeCloseTo(navbar.x, 1)
      expect(hero.width).toBeCloseTo(navbar.width, 1)
      expect(hero.y).toBeCloseTo(navbar.y + navbar.height, 1)
      const heroSurface = await page.locator('.history-intro').evaluate(element => getComputedStyle(element).backgroundColor)
      const brandSurface = await page.locator('.site-header-brand').evaluate(element => getComputedStyle(element).backgroundColor)
      expect(heroSurface).toBe(brandSurface)

      await expectNoUnexpectedAccessibilityViolations(page)
    }
    const openArchive = page.getByRole('link', { name: 'Open V1', exact: true })
    await openArchive.focus()
    await expect(openArchive).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/v1\/$/)
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
    await page.getByRole('link', { name: 'Website history', exact: true }).click()
    await expect(page).toHaveURL(/\/history\/$/)
  })
}

for (const id of ['v1', 'v2', 'v3']) {
  test(`${id} keeps navigation, assets, storage and robots scoped`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto(`/${id}/`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('a[href="/blog/"]')).toHaveCount(0)
    await expect(page.locator('a[href="/history/"]')).toHaveAttribute('data-astro-reload', '')
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(async image => {
        image.loading = 'eager'
        await image.decode()
      }))
    })
    expect(await page.locator('img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.naturalWidth > 0))).toBe(true)
    await page.locator(`a[href="/${id}/portfolio/"]`).first().click()
    await expect(page).toHaveURL(new RegExp(`/${id}/portfolio/$`))
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
    await page.getByRole('link', { name: 'View current page', exact: true }).click()
    await expect(page).toHaveURL(/\/portfolio\/$/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
}

test('archive newsletter cannot submit', async ({ page }) => {
  await page.goto('/v3/newsletter/')
  for (const form of await page.locator('form').all()) {
    await expect(form).toHaveAttribute('inert', '')
    await expect(form).not.toHaveAttribute('action', /https?:/)
  }
})

for (const id of ['v2', 'v3']) {
  test(`${id} search results open within the archive`, async ({ page }) => {
    await page.goto(`/${id}/`)
    await page.locator('[data-site-search-trigger]').click()
    await page.locator('#site-search-input').fill('astro')
    const result = page.locator('#site-search-results a').first()
    await expect(result).toHaveAttribute('href', new RegExp(`^/${id}/`))
    await result.click()
    await expect(page).toHaveURL(new RegExp(`/${id}/`))
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
  })
}

test('v1 portfolio tabs support keyboard selection', async ({ page }) => {
  await page.goto('/v1/portfolio/')
  const tabs = page.getByRole('tab')
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toBeFocused()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await page.keyboard.press('Home')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
})

for (const id of ['v1', 'v2', 'v3']) {
  test(`${id} supports mobile dark navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await page.goto(`/${id}/`)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const toggle = page.locator(id === 'v1' ? '#toggle-nav-menu-mobile' : '[data-mobile-nav-toggle]')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('link', { name: 'Website history', exact: true })).toBeVisible()
  })
}
