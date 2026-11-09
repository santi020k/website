import { expect, test } from '@playwright/test'

const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark'] as const) {
  for (const route of [guide, '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/']) {
    test(`print preserves complete code and returns to the screen layout: ${theme} ${route}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme })
      await page.setViewportSize({ width: 672, height: 1000 })
      await page.goto(route)
      const source = await page.locator('[data-article-code-folio]').evaluateAll(figures => figures.map(figure => ({
        code: figure.querySelector('pre code')?.textContent,
        copy: figure.querySelector('[data-ui-code-copy]')?.getAttribute('data-copy-value'),
        header: figure.querySelector('figcaption')?.textContent
      })))
      const title = page.getByRole('heading', { level: 1 })
      await expect(page.locator('[data-article-print-source]')).toBeHidden()
      await page.emulateMedia({ media: 'print' })
      for (const selector of ['.site-header', '[data-site-footer]', '[data-post-continuation]', '[data-page-section]:has(#related-writing)', '[data-article-newsletter]', '[data-ui-scroll-progress]', '[data-ui-code-copy]', '[data-section-copy]', '[data-code-preview]']) {
        for (const control of await page.locator(selector).all()) await expect(control).toBeHidden()
      }
      await expect(title).toBeVisible()
      await expect(page.locator('[data-article-print-source] a')).toHaveAttribute('href', `https://santi020k.com${route}`)
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
      const headingBox = await title.boundingBox()
      const summaryBox = await page.locator('[data-editorial-summary]').boundingBox()
      expect(headingBox && summaryBox && headingBox.y + headingBox.height < summaryBox.y).toBe(true)
      expect(await page.locator('[data-article-code-folio]').evaluateAll(figures => figures.map(figure => ({
        code: figure.querySelector('pre code')?.textContent,
        copy: figure.querySelector('[data-ui-code-copy]')?.getAttribute('data-copy-value'),
        header: figure.querySelector('figcaption')?.textContent
      })))).toEqual(source)
      expect(await page.locator('[data-code-complete]').evaluateAll(blocks => blocks.every(block => {
        const visible = block.checkVisibility({ contentVisibilityAuto: true })
        const height = block.getBoundingClientRect().height
        return visible && height > 0 && block.scrollWidth <= block.clientWidth + 1
      }))).toBe(true)
      expect(await page.locator('[data-code-complete] [data-line]').evaluateAll(lines => lines.every(line => line.getBoundingClientRect().height >= Number.parseFloat(getComputedStyle(line).lineHeight) - 1))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.emulateMedia({ media: 'screen' })
      await expect(page.locator('[data-article-print-source]')).toBeHidden()
      await expect(page.locator('.site-header')).toBeVisible()
      await expect(page.locator('[data-code-complete]').first()).toBeHidden()
      await expect(page.locator('[data-code-preview]').first()).toBeVisible()
      await expect(page.locator('[data-ui-code-copy]').first()).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', `santi020k-${theme}`)
    })
  }
}

test('print names the selected package manager and preserves its selection', async ({ page }) => {
  await page.goto('/blog/testing-react-components-with-vitest-and-react-testing-library/')
  const tabs = page.locator('[data-package-manager-code-tabs]').first()
  await tabs.getByRole('tab', { name: 'pnpm', exact: true }).click()
  const panel = tabs.locator('[role="tabpanel"][data-value="pnpm"]')
  const source = await panel.textContent()
  await page.emulateMedia({ media: 'print' })
  await expect(tabs.getByRole('tablist')).toBeHidden()
  await expect(panel).toBeVisible()
  await expect(panel).toHaveText(source ?? '')
  expect(await panel.evaluate(element => getComputedStyle(element, '::before').content)).toBe('"pnpm"')
  expect(await panel.locator('pre').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
  await page.emulateMedia({ media: 'screen' })
  await expect(tabs.getByRole('tab', { name: 'pnpm', exact: true })).toHaveAttribute('aria-selected', 'true')
})

test('print fits article tables without changing project print styles', async ({ page }) => {
  await page.goto('/blog/why-developer-experience-work-should-be-measured-like-product-work/')
  await page.setViewportSize({ width: 672, height: 1000 })
  await page.emulateMedia({ media: 'print' })
  const tables = page.locator('[data-prose-table]')
  expect(await tables.count()).toBeGreaterThan(0)
  const fits = await tables.evaluateAll(elements => elements.every(element => {
    const width = element.clientWidth
    return element.scrollWidth <= width + 1
  }))
  expect(fits).toBe(true)
  await page.goto('/portfolio/smith-commerce/')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.locator('[data-article-print-source]')).toHaveCount(0)
})

test('print exposes full examples without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(guide)
  await page.emulateMedia({ media: 'print' })
  // Screen-only content-visibility skipping is released at the next rendering update.
  await expect.poll(() => page.locator('[data-code-complete]').evaluateAll(blocks => blocks.every(block => (
    block.checkVisibility({ contentVisibilityAuto: true }) && block.getBoundingClientRect().height > 0
  )))).toBe(true)
  await expect(page.locator('[data-article-print-source]')).toBeVisible()
  await context.close()
})

test('print keeps the illustration and caption when its viewer is open', async ({ page }) => {
  await page.goto('/blog/migrate-eslint-8-or-less-to-eslint-9/')
  const figure = page.locator('[data-article-figure="1"]')
  await figure.getByRole('button', { name: 'View larger: From layers to flat config.' }).click()
  await expect(figure.locator('dialog')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(figure.locator('dialog')).toBeHidden()
  await expect(figure.locator('[data-gallery-actions]')).toBeHidden()
  await expect(figure.locator(':scope > img')).toBeVisible()
  await expect(figure.locator('[data-figure-caption]')).toBeVisible()
  await page.emulateMedia({ media: 'screen' })
  await expect(figure.locator('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
})
