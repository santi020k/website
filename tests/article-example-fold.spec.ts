import { expect, test } from '@playwright/test'

const article = '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'

test.use({ reducedMotion: 'reduce' })

test('long Markdown examples disclose complete code and copy it while collapsed', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (value: string) => {
        sessionStorage.setItem('fold-copied-code', value)
        return Promise.resolve()
      } }
    })
  })
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto(article)
  const figure = page.locator('[data-article-code-folio]').filter({ has: page.locator('[data-example-fold]') }).first()
  const summary = figure.locator('summary')
  const complete = figure.locator('[data-code-complete]')
  const preview = figure.locator('[data-code-preview] pre')
  const source = await complete.textContent()
  await expect(complete).toBeHidden()
  await expect(preview.locator('[data-line]')).toHaveCount(12)
  await expect(preview).toHaveAccessibleDescription('Scroll horizontally to read more')
  const copy = figure.getByRole('button')
  await expect(copy).toHaveAttribute('data-ui-copy-button-bound', 'true')
  await copy.press('Enter')
  await expect(copy).toHaveAccessibleName('Code copied to clipboard')
  expect(await page.evaluate(() => sessionStorage.getItem('fold-copied-code'))).toBe(source)

  await summary.focus()
  await expect(summary).toHaveCSS('outline-style', 'solid')
  await summary.press('Space')
  await expect(summary).toContainText('Collapse example')
  await expect(complete).toBeVisible()
  await expect(preview).toBeHidden()
  await expect(complete).toHaveAccessibleDescription('Scroll horizontally to read more')
  await expect.poll(() => complete.textContent()).toBe(source)
  await complete.focus()
  await complete.press('ArrowRight', { delay: 100 })
  await expect.poll(() => complete.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await summary.press('Enter')
  await expect(summary).toBeFocused()
  await expect(complete).toBeHidden()
  await expect(preview).toBeVisible()
  await summary.press('Tab')
  await expect(preview).toBeFocused()
  await preview.press('Tab')
  await expect(preview).not.toBeFocused()
})

test('fold summaries and code regions stay usable with enlarged mobile text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.goto(article)
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
  const figure = page.locator('[data-article-code-folio]').filter({ has: page.locator('[data-example-fold]') }).first()
  const summary = figure.locator('summary')
  for (const state of ['collapsed', 'expanded']) {
    await test.step(state, async () => {
      await expect(summary).toBeVisible()
      expect(await summary.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        return Array.from(element.children).every(child => {
          if (getComputedStyle(child).display === 'none') return true
          const rect = child.getBoundingClientRect()
          return rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom
        })
      })).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })

    await summary.press('Enter')
  }
})

test('printing exposes the complete example without the duplicate preview', async ({ page }) => {
  await page.goto(article)
  const figure = page.locator('[data-article-code-folio]').filter({ has: page.locator('[data-example-fold]') }).first()
  await page.emulateMedia({ media: 'print' })
  // WebKit's Playwright visibility heuristic assumes closed details are hidden,
  // even when ::details-content is visibly painted by the print stylesheet.
  await expect.poll(() => figure.locator('[data-code-complete] [data-line]').last().evaluate(element => element.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true }) &&
    element.getBoundingClientRect().height > 0)).toBe(true)
  await expect(figure.locator('[data-code-preview]')).toBeHidden()
})
