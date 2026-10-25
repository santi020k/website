import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const sections = [
  { id: 'core-challenge', title: 'Core challenge' },
  { id: 'what-i-owned', title: 'What I owned' },
  { id: 'before-and-after', title: 'Before and after' },
  { id: 'the-purchasing-challenge', title: 'The purchasing challenge' },
  { id: 'what-i-contributed', title: 'What I contributed' },
  { id: 'my-approach', title: 'My approach' }
]

for (const theme of ['light', 'dark']) {
  test(`narrative cadence preserves the chapter outline and reflows in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/#my-approach')
    await page.evaluate(() => document.fonts.ready)

    for (const section of sections) {
      const heading = page.getByRole('heading', { level: 3, name: section.title, exact: true })

      await expect(heading).toHaveCount(1)
      await expect(heading).toHaveAttribute('id', section.id)
      await expect(page.locator(`[data-project-chapters] a[href="#${section.id}"]`)).toHaveCount(1)
    }
    await expect(page.locator('[data-project-chapters] a')).toHaveCount(13)
    await expect(page.getByRole('heading', { name: 'Technical highlights', exact: true })).toBeAttached()
    await expect(page.getByRole('heading', { name: 'Inside the product', exact: true })).toBeAttached()

    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of [100, 200]) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = `${value}%`
        }, size)
        await page.locator('#the-purchasing-challenge').scrollIntoViewIfNeeded()
        expect(await page.locator('[data-project-section-heading] h3').evaluateAll(headings => headings.every(heading => {
          const bounds = heading.getBoundingClientRect()
          const parent = heading.parentElement?.getBoundingClientRect()

          const fitsText = heading.scrollWidth <= heading.clientWidth + 1

          return parent && bounds.left >= parent.left && bounds.right <= parent.right + 1 && fitsText
        }))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-project-section-heading]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}
