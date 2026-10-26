import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  test(`closing synthesis preserves its story and reflows in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/#why-this-experience-matters')
    await page.evaluate(() => document.fonts.ready)
    const reflection = page.getByRole('region', { name: 'Why this experience matters', exact: true })

    await expect(reflection.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'why-this-experience-matters')
    await expect(reflection.getByRole('heading', { level: 3 })).toHaveText(['Marcone', 'F.W. Webb'])
    await expect(reflection.getByRole('listitem').nth(0)).toContainText('Centered on modernizing a storefront and improving performance and accessibility.')
    await expect(reflection.getByRole('listitem').nth(1)).toContainText('Added deeper work on purchasing rules, account permissions, product discovery, and content integration.')
    await expect(reflection.locator('[data-synthesis-takeaway]')).toHaveText('Together, they reflect the frontend work I enjoy most: making complex systems understandable for customers and maintainable for the teams building them.')
    await expect(page.locator('[data-project-desktop-toc] [data-reading-contents] a')).toHaveCount(13)
    await expect(page.locator('[data-project-desktop-toc] [data-reading-contents] a[href="#why-this-experience-matters"]')).toHaveCount(1)

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await reflection.scrollIntoViewIfNeeded()
        expect(await reflection.locator('h2, h3, p, li').evaluateAll(elements => elements.every(element => element.scrollWidth <= element.clientWidth + 1))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const first = await reflection.getByRole('listitem').nth(0).evaluate(element => {
          const { left, top, bottom } = element.getBoundingClientRect()

          return { left, top, bottom }
        })
        const second = await reflection.getByRole('listitem').nth(1).evaluate(element => {
          const { left, top, bottom } = element.getBoundingClientRect()

          return { left, top, bottom }
        })
        const alignedColumns = Math.abs(first.top - second.top) < 1
        const stackedRows = [Math.abs(first.left - second.left) < 1, second.top >= first.bottom].every(Boolean)

        expect([alignedColumns, stackedRows]).toContain(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-project-synthesis]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}
