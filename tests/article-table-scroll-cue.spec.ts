import { expect, test } from '@playwright/test'

const article = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const cueText = 'Scroll horizontally to compare'

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.route('https://giscus.app/**', route => route.abort())
})

for (const theme of ['light', 'dark'] as const) {
  test(`table guidance stays outside scrolling content and follows reflow in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(article)
    await page.evaluate(() => document.fonts.ready)
    const surface = page.locator('[data-article-table-folio]').first()
    const viewport = surface.locator('[data-prose-table]')
    const cue = surface.locator('[data-scroll-cue-message]')
    const label = viewport.locator('tbody tr').first().locator(':scope > :first-child')
    const heading = viewport.locator('thead th').first()
    const value = viewport.locator('tbody tr').first().locator(':scope > :nth-child(2)')
    const content = await viewport.innerText()

    await expect(cue).toBeVisible()
    await expect(surface).toHaveCSS('border-top-right-radius', '28px')
    await expect(viewport).toHaveAccessibleDescription(cueText)
    await viewport.focus()
    const before = await cue.boundingBox()
    const labelBefore = await label.boundingBox()
    const headingBefore = await heading.boundingBox()
    const valueBefore = await value.boundingBox()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    await expect(viewport).toBeFocused()
    expect((await cue.boundingBox())?.x).toBe(before?.x)
    await viewport.evaluate(element => {
      element.scrollLeft = element.scrollWidth
    })
    expect((await label.boundingBox())?.x).toBe(labelBefore?.x)
    expect((await heading.boundingBox())?.x).toBe(headingBefore?.x)
    const valueAfter = await value.boundingBox()
    expect(valueAfter && valueBefore && valueAfter.x < valueBefore.x).toBe(true)
    await expect(viewport.locator('tbody tr').first().locator(':scope > :last-child')).toBeInViewport()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(cue).toBeHidden()
    await expect(viewport).not.toHaveAttribute('aria-describedby')
    await page.setViewportSize({ width: 320, height: 1000 })
    await expect(label).toHaveCSS('position', 'sticky')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await expect(cue).toBeVisible()
    await expect(label).toHaveCSS('position', 'static')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(viewport).toHaveText(content, { useInnerText: true })
    await expect(viewport.getByRole('table')).toHaveCount(1)
  })
}

test('reconnects table guidance after client navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto(article)
  const cue = page.locator('[data-article-table-folio] [data-scroll-cue-message]').first()
  await expect(cue).toBeVisible()
  await page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
    .getByRole('link', { name: 'Back to Blog', exact: true }).click()
  await expect(page).toHaveURL(/\/blog\/$/u)
  await page.goBack()
  await expect(cue).toBeVisible()
  await expect(page.locator('[data-prose-table]').first())
    .toHaveAttribute('aria-describedby', 'article-table-scroll-cue-1')
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('retains the named keyboard scroll region and native table', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.goto(article)
    const viewport = page.locator('[data-prose-table]').first()
    await expect(page.locator('[data-article-table-folio] [data-scroll-cue-message]').first()).toBeHidden()
    await expect(viewport).not.toHaveAttribute('aria-describedby')
    await expect(viewport).toHaveAttribute('tabindex', '0')
    await expect(viewport.getByRole('table')).toBeVisible()
    await viewport.focus()
    const label = viewport.locator('tbody tr').first().locator(':scope > :first-child')
    const before = await label.boundingBox()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    expect((await label.boundingBox())?.x).toBe(before?.x)
  })
})
