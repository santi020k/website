import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const sections = [
  { name: 'Experience', id: 'resume-experience' },
  { name: 'Earlier experience', id: 'resume-earlier-experience' },
  { name: 'Community', id: 'resume-community' },
  { name: 'Skills & expertise', id: 'resume-skills' }
]

for (const theme of ['light', 'dark'] as const) {
  test(`Resume margin index reflows and reaches every section in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/resume/')
    const index = page.getByRole('navigation', { name: 'On this page' })

    await expect(index.getByRole('link')).toHaveCount(4)
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await index.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('p, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        })

        expect(overflow, `Navigation must fit at ${width}px and ${size}%`).toEqual([])
        for (const link of await index.getByRole('link').all()) {
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    await page.setViewportSize({ width: 390, height: 900 })
    const first = index.getByRole('link').first()

    await first.focus()
    for (const link of await index.getByRole('link').all()) {
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    }
    for (const section of sections) {
      const link = index.getByRole('link', { name: section.name, exact: true })

      await expect(link).toHaveAttribute('href', `#${section.id}`)
      await link.focus()
      await page.keyboard.press('Enter')
      await expect.poll(() => new URL(page.url()).hash).toBe(`#${section.id}`)
      const heading = page.locator(`#${section.id} > h2`)

      await expect(heading).toBeInViewport()
      expect(await heading.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(100)
    }
    const audit = await new AxeBuilder({ page }).include('[data-resume-index]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Resume section links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })
  const page = await context.newPage()

  await page.goto('/resume/')
  for (const section of sections) {
    await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: section.name, exact: true }).click()
    await expect.poll(() => new URL(page.url()).hash).toBe(`#${section.id}`)
    await expect(page.locator(`#${section.id} > h2`)).toBeInViewport()
  }
  await context.close()
})

test('Resume margin index is excluded from both print variants', async ({ page }) => {
  await page.goto('/resume/')
  await page.emulateMedia({ media: 'print' })
  for (const variant of ['short', 'full']) {
    await page.evaluate(value => {
      document.documentElement.dataset.resumeVariant = value
    }, variant)
    await expect(page.locator('[data-resume-index]')).toBeHidden()
    await expect(page.locator('[data-resume-header]')).toBeVisible()
    await expect(page.locator('#resume-experience > h2')).toBeVisible()
  }
})
