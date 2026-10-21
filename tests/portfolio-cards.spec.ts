import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    for (const textSize of [100, 200]) {
      test(`layered portfolio cards preserve content at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto('/portfolio/')
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await page.evaluate(() => document.fonts.ready)
        const cards = page.locator('[data-portfolio-project]')

        await expect(cards).toHaveCount(7)
        await expect(cards.first().locator('[data-portfolio-value]')).toHaveText(['35 → 98', '75% less'])
        for (const card of await cards.all()) {
          const link = card.locator('a')

          await expect(link).toHaveCount(1)
          await expect(link).toHaveAttribute('href', /^\/portfolio\/.+\/$/u)
          const title = await card.locator('h3').innerText()

          await expect(link).toHaveAccessibleName(`Read case study: ${title}`)
          const geometry = await card.evaluate(element => {
            const body = element.querySelector('[data-portfolio-project-body]')
            const visual = element.querySelector('[data-portfolio-visual]')
            const status = element.querySelector('[data-project-status]')

            if (!body || !visual || !status) throw new Error('Incomplete portfolio card')
            const bounds = body.getBoundingClientRect()
            const cover = visual.getBoundingClientRect()
            const badge = status.getBoundingClientRect()
            const clipped = [...body.querySelectorAll('[data-portfolio-title], [data-portfolio-role], [data-portfolio-description], [data-portfolio-date], [data-portfolio-label], [data-portfolio-value], [data-portfolio-action], [data-portfolio-technologies]')].some(child => {
              const rect = child.getBoundingClientRect()
              const style = getComputedStyle(child)

              return rect.left < bounds.left || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1 ||
                child.scrollWidth > child.clientWidth + 1 || style.webkitLineClamp !== 'none'
            })

            return { clipped, overlap: cover.bottom - bounds.top, statusCovered: badge.bottom > bounds.top }
          })

          expect(geometry.clipped).toBe(false)
          expect(geometry.overlap).toBeGreaterThan(0)
          expect(geometry.statusCovered).toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      })
    }
  }

  test(`layered portfolio hover preserves geometry and readable project colors in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/')
    await page.evaluate(() => document.fonts.ready)
    for (const card of await page.locator('[data-portfolio-project]').all()) {
      const link = card.locator('a')
      const title = card.locator('h3')

      await card.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      const restingBounds = await card.boundingBox()
      const restingColor = await title.evaluate(element => getComputedStyle(element).color)

      await link.hover()
      await card.evaluate(async element => {
        await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
      })
      expect(await card.boundingBox()).toEqual(restingBounds)
      await expect(title).not.toHaveCSS('color', restingColor)
      const hoverColor = await title.evaluate(element => getComputedStyle(element).color)

      const audit = await new AxeBuilder({ page }).include('[data-portfolio-project]:hover').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(audit.violations).toEqual([])
      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await link.focus()
      await expect(title).toHaveCSS('color', hoverColor)
      await link.evaluate(element => {
        element.blur()
      })
    }
  })
}

test('layered portfolio actions navigate to the same case study as keyboard activation', async ({ page }) => {
  await page.goto('/portfolio/')
  const card = page.locator('[data-portfolio-project]').first()

  await card.locator('a').click({ position: { x: 30, y: 30 } })
  await expect(page).toHaveURL('/portfolio/smith-commerce/')
  await page.goto('/portfolio/')
  await card.locator('a').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/portfolio/smith-commerce/')
})
