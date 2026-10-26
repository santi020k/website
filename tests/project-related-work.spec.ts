import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const { width, textSize, layout } of [
    { width: 320, textSize: 200, layout: 'stacked' },
    { width: 390, textSize: 100, layout: 'stacked' },
    { width: 768, textSize: 100, layout: 'sideBySide' },
    { width: 1440, textSize: 100, layout: 'sideBySide' },
    { width: 1440, textSize: 200, layout: 'stacked' }
  ] as const) {
    test(`related project summaries fit at ${width}px and ${textSize}% in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)

      for (const slug of ['smith-commerce', 'lumen-ui', 'roadscore']) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const cards = page.locator('[data-related-project]')

        await expect(cards).toHaveCount(2)
        await expect(cards.locator('[data-related-number]')).toHaveText(['01', '02'])
        for (const card of await cards.all()) {
          const title = await card.getByRole('heading', { level: 3 }).innerText()
          const link = card.getByRole('link', { name: `Read case study: ${title}`, exact: true })

          await expect(card.getByRole('link')).toHaveCount(1)
          await expect(link).toHaveAttribute('href', /^\/portfolio\/.+\/$/u)
          await expect(card.locator('[data-related-number]')).toHaveAttribute('aria-hidden', 'true')
          const arrangement = await card.evaluate(element => {
            const artwork = element.querySelector('[data-related-artwork]')?.getBoundingClientRect()
            const heading = element.querySelector('h3')?.getBoundingClientRect()

            if (!artwork || !heading) return null
            return { stacked: heading.top >= artwork.bottom, sideBySide: heading.left >= artwork.right }
          })

          expect(arrangement?.[layout]).toBe(true)
          const clipped = await card.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('h3, p, [data-related-action]')].some(child => {
              const rect = child.getBoundingClientRect()

              return rect.left < bounds.left || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1 ||
                child.scrollWidth > child.clientWidth + 1 || getComputedStyle(child).webkitLineClamp !== 'none'
            })
          })

          expect(clipped).toBe(false)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        const followsReadingOrder = await cards.evaluateAll(elements => {
          const first = elements[0]?.getBoundingClientRect()
          const second = elements[1]?.getBoundingClientRect()

          if (!first || !second) return false
          return Math.abs(first.left - second.left) < 1 &&
            Math.abs(first.width - second.width) < 1 && second.top >= first.bottom - 1
        })

        expect(followsReadingOrder).toBe(true)
      }
    })
  }

  test(`related project hover and keyboard emphasis stay accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/')
    await expect(page.locator('[data-related-project] h3')).toHaveText(['Void.GG', 'Optic Power'])
    for (const card of await page.locator('[data-related-project]').all()) {
      await card.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      const bounds = await card.boundingBox()
      const title = card.getByRole('heading')
      const restingColor = await title.evaluate(element => getComputedStyle(element).color)
      const link = card.getByRole('link')

      await link.hover()
      expect(await card.boundingBox()).toEqual(bounds)
      await expect(title).not.toHaveCSS('color', restingColor)
      const hoverColor = await title.evaluate(element => getComputedStyle(element).color)

      await page.mouse.move(0, 0)
      await page.keyboard.press('Tab')
      await link.focus()
      await expect(title).toHaveCSS('color', hoverColor)
      await expect(link).not.toHaveCSS('outline-style', 'none')
      const audit = await new AxeBuilder({ page }).include('[data-related-project]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(audit.violations).toEqual([])
      await link.evaluate(element => {
        element.blur()
      })
    }
  })
}

test('continuation shelf links navigate by pointer and keyboard without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  try {
    await page.goto('/portfolio/smith-commerce/')
    await page.getByRole('link', { name: 'Read case study: Void.GG', exact: true }).click()
    await expect(page).toHaveURL('/portfolio/void/')
    await page.goto('/portfolio/smith-commerce/')
    await page.getByRole('link', { name: 'Read case study: Optic Power', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/portfolio/optic-power/')
  } finally {
    await context.close()
  }
})

test('a project without related entries has no empty shelf', async ({ page }) => {
  await page.goto('/portfolio/react-js-colombia/')
  await expect(page.locator('#related-work')).toHaveCount(0)
  await expect(page.locator('[data-related-project]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Back to Speaking & Community', exact: true })).toHaveAttribute('href', '/speaking/')
})
