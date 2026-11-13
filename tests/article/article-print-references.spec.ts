import { expect, test } from '@playwright/test'

const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark'] as const) {
  test(`Reference notes print without changing the code or screen reading: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.setViewportSize({ width: 672, height: 1000 })
    await page.goto(guide)
    const notes = page.locator('[data-article-print-references]')
    const markers = page.locator('[data-print-reference]')
    const code = await page.locator('[data-article-code-folio]').allTextContents()
    const originalLink = page.locator('#article-content a[href="https://playwright.dev/docs/accessibility-testing"]')

    await expect(notes).toBeHidden()
    expect(await markers.count()).toBeGreaterThan(0)
    for (const marker of await markers.all()) await expect(marker).toBeHidden()
    await expect(page.locator('[data-article-code-folio] [data-print-reference]')).toHaveCount(0)
    await expect(page.locator('[data-reading-rail] a[href="#article-print-references-heading"]')).toHaveCount(0)
    await page.emulateMedia({ media: 'print' })
    await expect(notes.getByRole('heading', { name: 'References', exact: true })).toBeVisible()
    await expect(originalLink).toHaveText('Playwright accessibility guide')
    for (const marker of await markers.all()) {
      await expect(marker).toBeVisible()
      const href = await marker.locator('a').getAttribute('href')

      expect(href).toMatch(/^#article-print-reference-\d+$/u)
      await expect(page.locator(href ?? '#missing-reference')).toBeVisible()
    }
    const hrefs = await notes.locator('li > a').evaluateAll(links => links.map(link => link.getAttribute('href')))

    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs).toContain('https://playwright.dev/docs/accessibility-testing')
    expect(hrefs).toContain('https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/')
    expect(hrefs).toContain('https://santi020k.com/blog/astro-doctor-announcement/')
    expect(await notes.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await expect(page.locator('[data-article-code-folio]')).toHaveText(code)
    expect(await page.locator('[data-article-code-folio] pre').evaluateAll(blocks => blocks.every(block => block.scrollWidth <= block.clientWidth + 1))).toBe(true)
    await page.emulateMedia({ media: 'screen' })
    await expect(notes).toBeHidden()
    for (const marker of await markers.all()) await expect(marker).toBeHidden()
    await expect(page.locator('[data-ui-code-copy]').first()).toBeVisible()
  })
}

test('Reference notes are static and readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  await page.goto(guide)
  await expect(page.locator('[data-article-print-references]')).toBeHidden()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('[data-article-print-references]')).toBeVisible()
  await expect(page.locator('[data-print-reference]').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})

test('Reference notes leave no extra heading or markers after client navigation', async ({ page }) => {
  await page.goto(guide)
  await page.locator('[data-cover-byline] a').click()
  await expect(page).toHaveURL(/\/about\/$/u)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('[data-article-print-references], [data-print-reference]')).toHaveCount(0)
  await expect(page.locator('.site-header')).toBeVisible()
})
