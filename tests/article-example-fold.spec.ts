import { expect, test } from '@playwright/test'

const article = '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/'
const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'

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

  await summary.press('Enter')
  const button = figure.getByRole('button', { name: 'Collapse example', exact: true })
  await expect(button).toBeVisible()
  expect(await button.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth
  })).toBe(true)
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
  await expect(figure.locator('[data-code-fold-footer]')).toBeHidden()
})

for (const route of [article, guide]) {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    test(`bottom collapse returns to its opener: ${route}, ${reducedMotion}`, async ({ page, browserName }) => {
      await page.emulateMedia({ reducedMotion })
      await page.setViewportSize({ width: 390, height: 900 })
      await page.goto(route)
      const folds = page.locator('[data-article-prose] [data-example-fold]')
      const fold = folds.first()
      const summary = fold.locator('summary')
      const complete = fold.locator('[data-code-complete]')
      const source = await complete.textContent() ?? ''
      expect(source).not.toBe('')
      await summary.click()
      await folds.nth(1).locator('summary').click()

      const button = fold.getByRole('button', { name: 'Collapse example', exact: true })
      await complete.focus()
      await complete.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(button).toBeFocused()
      await expect(button).toHaveCSS('outline-style', 'solid')
      await button.press('Enter')
      await expect(fold).not.toHaveAttribute('open')
      await expect(folds.nth(1)).toHaveAttribute('open')
      await expect(summary).toBeFocused()
      await expect(summary).toBeInViewport()
      expect(await summary.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(96)
      await expect(complete).toBeHidden()
      await expect(complete).toHaveText(source)

      await summary.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(fold.locator('..').locator('[data-code-preview] pre')).toBeFocused()

      await summary.press('Space')
      await expect(complete).toBeVisible()
      await button.click()
      await expect(summary).toBeFocused()
      await expect(fold).not.toHaveAttribute('open')

      // Repeated Astro initialization must not add controls or rewrap the cue.
      await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')))
      await expect(page.locator('[data-code-fold-footer]')).toHaveCount(await folds.count())
      await expect(fold.locator('[data-code-fold-footer] [data-scroll-cue-message]')).toHaveCount(1)
    })
  }

  test(`native example disclosure remains usable without JavaScript: ${route}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(route)
    const fold = page.locator('[data-example-fold]').first()
    await expect(page.locator('[data-fold-return]')).toHaveCount(0)
    await fold.locator('summary').click()
    await expect(fold.locator('[data-code-complete]')).toBeVisible()
    await fold.locator('summary').press('Enter')
    await expect(fold.locator('[data-code-complete]')).toBeHidden()
    await context.close()
  })
}
