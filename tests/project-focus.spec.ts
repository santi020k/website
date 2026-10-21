import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const { width, textSize } of [
    { width: 320, textSize: 200 },
    { width: 390, textSize: 100 },
    { width: 1024, textSize: 200 },
    { width: 1440, textSize: 100 }
  ]) {
    test(`project focus remains readable at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      for (const [slug, statement] of [
        ['smith-commerce', 'Architecture, delivery leadership, and product quality under real constraints.'],
        ['lumen-ui', 'Open source, self-directed tools, and practical developer experience.']
      ] as const) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await page.evaluate(() => document.fonts.ready)
        const card = page.getByRole('region', { name: 'Focus', exact: true })

        await expect(card.getByRole('heading', { name: 'Focus', level: 2 })).toBeVisible()
        await expect(card.locator('p')).toHaveText(statement)
        await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
        expect(await card.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h2, p')].every(child => {
            const range = document.createRange()

            range.selectNodeContents(child)
            return [...range.getClientRects()].every(rect => !rect.width || (
              rect.left >= bounds.left && rect.right <= bounds.right &&
              rect.top >= bounds.top && rect.bottom <= bounds.bottom
            ))
          })
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    })
  }

  test(`project focus remains passive and accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/')
    const card = page.getByRole('region', { name: 'Focus', exact: true })

    await card.scrollIntoViewIfNeeded()
    const appearance = () => card.evaluate(element => [element, ...element.querySelectorAll('*')].map(child => {
      const style = getComputedStyle(child)

      return [style.backgroundColor, style.color, style.transform, style.borderColor]
    }))
    const before = await appearance()

    await card.hover()
    expect(await appearance()).toEqual(before)
    const audit = await new AxeBuilder({ page }).include('[data-project-focus]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}
