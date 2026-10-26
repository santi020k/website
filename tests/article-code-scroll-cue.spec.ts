import { expect, test } from '@playwright/test'

const article = '/blog/avoid-magic-strings-in-typescript-and-javascript/'
const cueText = 'Scroll horizontally to read more'

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.route('https://giscus.app/**', route => route.abort())
})

for (const theme of ['light', 'dark'] as const) {
  test(`shows guidance only for overflowing code and follows resizing in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(article)
    await page.evaluate(() => document.fonts.ready)

    const figure = page.locator('[data-article-code-folio]').first()
    const pre = figure.locator('pre')
    const cue = figure.locator('[data-scroll-cue-message]')
    const originalCode = await pre.innerText()

    await expect(cue).toBeVisible()
    await expect(pre).toHaveAccessibleDescription(cueText)
    await pre.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => pre.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    await expect(pre).toBeFocused()
    await pre.evaluate(element => {
      element.scrollLeft = element.scrollWidth
    })
    await expect(cue).toBeVisible()

    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(cue).toBeHidden()
    await expect(pre).not.toHaveAttribute('aria-describedby')

    await page.setViewportSize({ width: 320, height: 1000 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await expect(cue).toBeVisible()
    await expect(pre).toHaveAccessibleDescription(cueText)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(await cue.evaluate(element => {
      const frame = element.getBoundingClientRect()
      return Array.from(element.children).every(child => {
        const bounds = child.getBoundingClientRect()
        return bounds.left >= frame.left && bounds.right <= frame.right
      })
    })).toBe(true)
    await expect(pre).toHaveText(originalCode)
  })
}

test('reconnects after client navigation without duplicating cues or descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto(article)
  const cue = page.locator('[data-scroll-cue-message]').first()
  await expect(cue).toBeVisible()
  const count = await page.locator('[data-scroll-cue-message]').count()
  await page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
    .getByRole('link', { name: 'Back to Blog', exact: true }).click()
  await expect(page).toHaveURL(/\/blog\/$/u)
  await page.goBack()
  await expect(cue).toBeVisible()
  await expect(page.locator('[data-scroll-cue-message]')).toHaveCount(count)
  await expect(page.locator('[data-article-code-folio] pre').first())
    .toHaveAttribute('aria-describedby', 'article-code-scroll-cue-1')
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('keeps native code readable and hides unmeasured guidance', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.goto(article)
    const figure = page.locator('[data-article-code-folio]').first()
    await expect(figure.locator('[data-scroll-cue-message]')).toHaveCount(1)
    await expect(figure.locator('[data-scroll-cue-message]')).toBeHidden()
    await expect(figure.locator('pre')).not.toHaveAttribute('aria-describedby')
    await expect(figure.locator('pre')).toHaveAttribute('tabindex', '0')
    await expect(figure.locator('pre code')).toContainText('ORDER_STATUS')
  })
})
