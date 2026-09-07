import { expect, test } from '@playwright/test'

test.describe('Mobile menu + search dialog interaction', () => {
  test('opening search while the mobile menu is still open leaves it reachable and focused', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menuToggle = page.locator('[data-mobile-nav-toggle]')

    await menuToggle.click()
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#mobile-nav')).toBeVisible()

    // The search trigger sits in the header shell above the mobile-nav backdrop,
    // so it must stay clickable while the menu is open behind it.
    const searchTrigger = page.locator('[data-site-search-trigger]')

    await expect(searchTrigger).toBeVisible()
    await searchTrigger.click()

    const dialog = page.locator('#site-search-dialog')

    await expect(dialog).toBeVisible()
    await expect(page.locator('#site-search-input')).toBeFocused()
  })

  test('tabbing inside the search dialog stays in the dialog instead of jumping to the menu behind it', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.locator('[data-mobile-nav-toggle]').click()
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('#site-search-input')).toBeFocused()

    // Safari uses Option-Tab to include links and buttons in keyboard navigation.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(page.locator('#site-search-input')).not.toBeFocused()

    const activeElementLocation = await page.evaluate(() => ({
      inDialog: document.getElementById('site-search-dialog')?.contains(document.activeElement) ?? false,
      inMobileNav: document.getElementById('mobile-nav')?.contains(document.activeElement) ?? false
    }))

    expect(activeElementLocation.inDialog).toBe(true)
    expect(activeElementLocation.inMobileNav).toBe(false)
  })

  test('closing search while the menu is still open keeps the page scroll-locked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.locator('[data-mobile-nav-toggle]').click()
    await page.locator('[data-site-search-trigger]').click()
    await expect(page.locator('#site-search-dialog')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator('#site-search-dialog')).toBeHidden()
    await expect(page.locator('#mobile-nav')).toBeVisible()

    const htmlClasses = await page.evaluate(() => Array.from(document.documentElement.classList))

    expect(htmlClasses).toContain('mobile-nav-open')

    const overflowValue = await page.evaluate(() => getComputedStyle(document.documentElement).overflow)

    expect(overflowValue).toBe('clip')

    await page.keyboard.press('Escape')
    await expect(page.locator('#mobile-nav')).toBeHidden()
    await expect(page.locator('[data-mobile-nav-toggle]')).toBeFocused()

    const menuStillLocksScroll = await page.evaluate(() => document.documentElement.classList.contains('mobile-nav-open'))

    expect(menuStillLocksScroll).toBe(false)
  })
})
