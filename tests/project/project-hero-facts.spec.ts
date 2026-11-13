import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1024, 1440]) {
    for (const textSize of [100, 200]) {
      test(`project hero keeps complete facts once at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        for (const slug of ['smith-commerce', 'lumen-ui']) {
          await page.goto(`/portfolio/${slug}/`)
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await page.evaluate(() => document.fonts.ready)
          const card = page.locator('[data-project-imprint]')

          await expect(card).toBeVisible()
          await expect(page.getByRole('region', { name: 'At a glance', exact: true })).toHaveCount(0)
          // The sidebar's scope ledger has its own terms; the hero facts occur once.
          await expect(page.locator('dt').filter({ hasText: /^(?:Role|Timeline|Duration)$/u })).toHaveCount(3)
          await expect(card.locator('dt')).toHaveText(['Role', 'Timeline', 'Duration'])
          await expect(card.locator('dd').first()).toHaveText(slug === 'smith-commerce' ? 'Senior Front End Developer' : 'Creator')
          await expect(page.locator('[data-project-opening] [data-site-eyebrow]')).toHaveText(slug === 'smith-commerce' ? 'Professional work' : 'Personal project')
          await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
          const overflow = await card.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            const clipped: string[] = []
            for (const child of element.querySelectorAll('dt, dd, h2')) {
              const range = document.createRange()

              range.selectNodeContents(child)
              if ([...range.getClientRects()].some(rect => rect.width && (
                rect.left < bounds.left || rect.right > bounds.right ||
                rect.top < bounds.top || rect.bottom > bounds.bottom
              ))) {
                clipped.push(child.textContent)
              }
            }
            return clipped
          })

          expect(overflow).toEqual([])
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        }
      })
    }
  }

  test(`project hero facts are passive and accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/')
    const card = page.locator('[data-project-imprint]')

    await card.scrollIntoViewIfNeeded()
    const appearance = () => card.evaluate(element => [element, ...element.querySelectorAll('*')].map(child => {
      const style = getComputedStyle(child)

      return [style.backgroundColor, style.color, style.transform, style.borderColor]
    }))
    const before = await appearance()

    await card.hover()
    expect(await appearance()).toEqual(before)
    const audit = await new AxeBuilder({ page }).include('[data-project-imprint]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}
