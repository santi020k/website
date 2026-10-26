import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`Technology evidence index is readable and keyboard usable in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/react-js/')
    const hero = page.locator('.editorial-page-hero')
    const index = hero.getByRole('navigation', { name: 'Technology evidence' })
    const links = index.getByRole('link')

    await expect(hero.getByRole('heading', { level: 1 })).toHaveText('React.js In practice.')
    await expect(links).toHaveText(['7 Work experience', '4 Projects', '1 Community'])
    await expect(hero.locator('.editorial-page-description')).toContainText('12 entries across professional work, independent projects, and community.')
    await links.first().focus()
    for (const link of await hero.getByRole('link').all()) {
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    }
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const overflowing = await hero.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h1, p, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        })

        expect(overflowing, `Opening must fit at ${width}px and ${size}%`).toEqual([])
        for (const link of await hero.getByRole('link').all()) {
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
      }
    }
    const audit = await new AxeBuilder({ page }).include('.editorial-page-hero').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Technology counts match rendered groups and omit unavailable destinations', async ({ page }) => {
  for (const slug of ['react-js', 'node-js', 'swiftui', '3rd-party-apis', 'model-context-protocol']) {
    await page.goto(`/technologies/${slug}/`)
    const index = page.getByRole('navigation', { name: 'Technology evidence' })
    const sections = page.locator('section[aria-labelledby^="technology-"]')

    await expect(index.getByRole('link')).toHaveCount(await sections.count())
    for (const link of await index.getByRole('link').all()) {
      const href = await link.getAttribute('href') ?? ''

      expect(href).toMatch(/^#technology-(?:work|projects|community)-heading$/u)
      const heading = page.locator(href)
      const section = page.locator(`section[aria-labelledby="${href.slice(1)}"]`)
      const count = await section.locator('[data-project-gallery-card]').count()

      await expect(heading).toHaveCount(1)
      expect(count).toBeGreaterThan(0)
      await expect(link.locator('[data-technology-evidence-count]')).toHaveText(String(count))
    }
    await expect(page.locator('[data-sculpted-stat]')).toHaveCount(0)
  }
  await expect(page.locator('.editorial-page-description')).toContainText('1 entry in independent projects.')
})

test('Evidence destinations jump to visible headings without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })

  try {
    const page = await context.newPage()

    for (const label of ['Work experience', 'Projects', 'Community']) {
      await page.goto('/technologies/react-js/')
      const link = page.getByRole('navigation', { name: 'Technology evidence' }).getByRole('link', { name: new RegExp(label, 'u') })
      const href = await link.getAttribute('href') ?? ''

      await link.focus()
      await page.keyboard.press('Enter')
      await expect.poll(() => new URL(page.url()).hash).toBe(href)
      const heading = page.locator(href)

      await expect(heading).toBeInViewport()
      expect(await heading.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80)
    }
  } finally {
    await context.close()
  }
})
