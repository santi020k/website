import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const size of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`formatted article headings wrap at ${width}px, ${size}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto('/blog/migrate-eslint-8-or-less-to-eslint-9/')
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)

        const heading = page.getByRole('heading', { name: '4. Use FlatCompat only as a transition layer', exact: true })

        await expect(heading).toHaveAttribute('id', /\S/u)
        const fragment = await heading.evaluate(element => element.id)

        await expect(page.getByRole('link', {
          name: '4. Use FlatCompat only as a transition layer', exact: true, includeHidden: true
        }).first()).toHaveAttribute('href', `#${fragment}`)
        await expect(heading.locator('code')).toHaveText('FlatCompat')
        expect(await page.locator('[data-article-prose] h2').evaluateAll(headings => headings.every(element => {
          const bounds = element.getBoundingClientRect()
          const text = element.querySelector('[data-article-heading-text]')

          if (!text) return false
          const content = text.getBoundingClientRect()

          return element.scrollWidth <= element.clientWidth + 1 &&
            text.scrollWidth <= text.clientWidth + 1 &&
            bounds.left >= 0 && bounds.right <= innerWidth &&
            content.left >= bounds.left && content.right < bounds.right
        }))).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      })
    }
  }
}

test('MDX section headings remain native and project headings retain their composition', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  await page.goto('/blog/dep-beacon-vscode-extension/')
  const headings = page.locator('[data-article-prose] h2')

  expect(await headings.count()).toBeGreaterThan(0)
  expect(await headings.evaluateAll(elements => elements.every(element => element.id && element.querySelector('[data-article-heading-text]')?.textContent === element.textContent))).toBe(true)
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('[data-article-section-heading]')).toHaveCount(0)
  expect(await page.locator('[data-project-section-heading] h3').count()).toBeGreaterThan(0)
  await context.close()
})
