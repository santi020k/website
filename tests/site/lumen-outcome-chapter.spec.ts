import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const openNavigation = async (page: Page, width: number) => {
  const navigation = page.locator(width < 1024 ? '[data-project-mobile-toc]' : '[data-project-desktop-toc]')

  if (width < 1024) await navigation.locator('[data-toc-summary]').click()

  return navigation
}

for (const javaScriptEnabled of [true, false]) {
  test(`Lumen Outcomes is a native chapter destination with JavaScript ${javaScriptEnabled}`, async ({ browser, browserName }) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' })
    const page = await context.newPage()

    try {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto('/portfolio/lumen-ui/')
        const navigation = await openNavigation(page, width)

        const links = navigation.locator('a')

        await expect(links).toHaveCount(8)
        await expect(links.nth(1)).toHaveText('Inside the product')
        await expect(links.nth(2)).toHaveText('Outcomes')
        await expect(links.nth(3)).toHaveText('Goals')
        const outcomeLink = navigation.getByRole('link', { name: 'Outcomes', exact: true })

        await links.nth(1).focus()
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(outcomeLink).toBeFocused()
        expect(await outcomeLink.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
        expect((await outcomeLink.boundingBox())?.height).toBeGreaterThanOrEqual(44)
        await expect(outcomeLink).toHaveAttribute('href', '#outcomes')
        await outcomeLink.press('Enter')
        await expect(page).toHaveURL(/#outcomes$/u)
        const heading = page.getByRole('heading', { name: 'Outcomes', exact: true })

        await expect(heading).toHaveCount(1)
        await expect(heading).toHaveAttribute('id', 'outcomes')
        await expect(heading).toBeInViewport()
        const headerBottom = await page.locator('.site-header').evaluate(element => element.getBoundingClientRect().bottom)

        expect((await heading.boundingBox())?.y).toBeGreaterThanOrEqual(headerBottom)
        await expect(page.getByRole('region', { name: 'Outcomes', exact: true })).toHaveCount(1)

        await page.goto('/portfolio/lumen-ui/#sidebar-outcomes')
        await expect(heading).toBeInViewport()
        await expect(page.locator('#sidebar-outcomes')).toHaveCount(1)
      }
    } finally {
      await context.close()
    }
  })
}

for (const theme of ['light', 'dark']) {
  test(`Lumen Outcomes chapter tracks reading and reflows in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/lumen-ui/#outcomes')
    await page.evaluate(() => document.fonts.ready)
    const rail = page.locator('[data-project-desktop-toc]')

    await page.setViewportSize({ width: 1440, height: 1000 })
    await rail.getByRole('link', { name: 'Outcomes', exact: true }).click()
    await expect(rail.getByRole('link', { name: 'Outcomes', exact: true })).toHaveAttribute('aria-current', 'location')
    for (const id of ['inside-the-product', 'outcomes', 'goals']) {
      await page.locator(`#${id}`).evaluate(element => {
        window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 100)
      })
      await expect(rail.locator(`a[href="#${id}"]`)).toHaveAttribute('aria-current', 'location')
    }

    await page.setViewportSize({ width: 320, height: 1000 })
    await openNavigation(page, 320)

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const navigation = page.locator('[data-project-mobile-toc]:visible, [data-project-desktop-toc]:visible')

      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await navigation.getByRole('link', { name: 'Outcomes', exact: true }).scrollIntoViewIfNeeded()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(await navigation.locator('a').evaluateAll(links => links.every(link => link.scrollWidth <= link.clientWidth + 1))).toBe(true)
      }
      const result = await new AxeBuilder({ page }).include('[data-project-mobile-toc]').include('[data-project-desktop-toc]').include('[data-project-outcomes]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(result.violations).toEqual([])
    }
  })
}
