import { expect, type Page, test } from '@playwright/test'

const eras = ['v1', 'v2', 'v3'] as const

type Era = typeof eras[number]

const controls = (page: Page, era: Era) => ({
  toggle: page.locator(era === 'v1' ? '#toggle-nav-menu-mobile' : '[data-mobile-nav-toggle]'),
  panel: page.locator(era === 'v1' ? '#drawer' : '[data-mobile-nav-panel]'),
  theme: page.locator(era === 'v3' ? 'header [data-theme-toggle-btn]' : 'header theme-toggle button')
})

const expectVisibleFocus = async (page: Page) => {
  expect(await page.evaluate(() => {
    const element = document.activeElement

    if (!(element instanceof HTMLElement) || element === document.body) return false

    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)

    return rect.width > 0 && rect.height > 0 &&
      rect.top >= 0 && rect.bottom <= innerHeight + 1 &&
      style.visibility === 'visible' &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]')
  })).toBe(true)
}

for (const era of eras) {
  const destination = `/${era}/${era === 'v1' ? 'portfolio' : 'work'}/`

  for (const key of ['Enter', 'Space']) {
    test(`${era} mobile navigation supports ${key} and Escape`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/${era}/`)

      const { toggle, panel } = controls(page, era)

      await toggle.focus()
      await expect(toggle).toBeFocused()
      await page.keyboard.press(key)
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(panel).toHaveAttribute('aria-hidden', 'false')
      await expectVisibleFocus(page)
      await page.keyboard.press('Escape')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(toggle).toBeFocused()
      await expect(panel).toBeHidden()
      await expect(panel).toHaveAttribute('aria-hidden', 'true')
    })
  }

  test(`${era} keyboard cycle includes the visible Close control`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${era}/`)

    const { toggle, panel } = controls(page, era)

    await toggle.click()
    const firstLink = panel.locator('a[href]').first()
    await firstLink.focus()
    await page.keyboard.press('Shift+Tab')
    await expect(toggle).toBeFocused()
    await expectVisibleFocus(page)
    await page.keyboard.press('Tab')
    await expect(firstLink).toBeFocused()
    await panel.locator('a[href]').last().focus()
    await page.keyboard.press('Tab')
    await expectVisibleFocus(page)
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('header, #drawer')))).toBe(true)
    await firstLink.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await expect(panel).toBeHidden()
  })

  test(`${era} visible theme control is reachable while navigation is open`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${era}/`)
    const { toggle, panel, theme } = controls(page, era)
    const initialTheme = await page.locator('html').getAttribute('data-theme')

    await expect(theme).toHaveAccessibleName(/theme/i)

    await toggle.click()
    await panel.locator('a[href]').first().focus()
    await page.keyboard.press('Shift+Tab')
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(theme).toBeFocused()
    await page.keyboard.press('Space')
    await expect(page.locator('html')).toHaveAttribute('data-theme', initialTheme === 'dark' ? 'light' : 'dark')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test(`${era} resizing to desktop preserves visible keyboard focus`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${era}/`)

    const { toggle, panel } = controls(page, era)

    await toggle.click()
    await panel.locator('a[href]').first().focus()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toBeHidden()
    await expectVisibleFocus(page)
    expect(await page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden')
  })

  test(`${era} menu remains operable after client navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${era}/`)

    const { toggle, panel } = controls(page, era)

    await toggle.click()
    await panel.locator(`a[href="${destination}"]`).first().focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${destination}$`))
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.focus()
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toHaveAttribute('aria-hidden', 'false')
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(panel).toBeHidden()
  })

  test(`${era} reopening during the closing animation keeps navigation open`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(`/${era}/`)

    const { toggle, panel } = controls(page, era)

    await toggle.click()
    await toggle.evaluate(element => {
      if (!(element instanceof HTMLElement)) throw new Error('Expected navigation toggle')

      element.click()
      element.click()
    })
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    // Cross the old close fallback deadline without waiting for arbitrary network activity.
    await page.evaluate(() => new Promise<void>(resolve => {
      window.setTimeout(resolve, 400)
    }))
    await expect(panel).toBeVisible()
    await expect(panel).toHaveAttribute('aria-hidden', 'false')
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(panel).toBeHidden()
  })
}

for (const era of ['v2', 'v3'] as const) {
  test(`${era} search retains keyboard ownership above mobile navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${era}/`)
    const { toggle } = controls(page, era)

    await toggle.click()
    await page.locator('[data-site-search-trigger]').click()
    const input = page.locator('#site-search-input')

    await expect(input).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('[data-site-search-close]')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    await input.fill('astro')
    await page.locator('#site-search-results a').first().waitFor()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expectVisibleFocus(page)
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })
}

test('v2 header scroll state follows the current header after client navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/v2/')
  await page.locator('a[href="/v2/work/"]:visible').first().click()
  await expect(page).toHaveURL(/\/v2\/work\/$/)
  await page.evaluate(() => {
    window.scrollTo(0, 700)
  })
  await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
  await page.evaluate(() => {
    window.scrollTo(0, 0)
  })
  await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'false')
})

test('v1 menu icons reflect repeated keyboard opening and dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/v1/')
  const { toggle } = controls(page, 'v1')

  for (let cycle = 0; cycle < 2; cycle += 1) {
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#open-nav-menu-icon')).toHaveCSS('opacity', '0')
    await expect(page.locator('#close-nav-menu-icon')).toHaveCSS('opacity', '1')
    await page.keyboard.press('Escape')
    await expect(page.locator('#open-nav-menu-icon')).toHaveCSS('opacity', '1')
    await expect(page.locator('#close-nav-menu-icon')).toHaveCSS('opacity', '0')
  }
})
