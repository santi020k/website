import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

const article = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const cueText = 'Scroll horizontally to read more'
const sourceNames = ['scan', 'dialog', 'skip-link'] as const

test.use({ reducedMotion: 'reduce' })

for (const theme of ['light', 'dark'] as const) {
  test(`imported examples retain complete headers, source, and keyboard scrolling in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(article)
    await page.evaluate(() => document.fonts.ready)
    const figures = page.locator('[data-article-prose] [data-article-code-folio]')
    await expect(figures).toHaveCount(4)

    for (const [index, name] of sourceNames.entries()) {
      const block = figures.nth(index + 1)
      const summary = block.locator('summary')
      await expect(block.locator('[data-code-preview] [data-line]')).toHaveCount(12)
      await summary.press('Enter')
      const pre = block.locator('[data-code-complete]')
      const source = readFileSync(new URL(`./accessibility-guide/${name}.spec.ts`, import.meta.url), 'utf8')
      await expect.poll(() => pre.textContent()).toBe(source)
      await expect(block.locator('figcaption')).toContainText(`tests/accessibility-guide/${name}.spec.ts`)
      await expect(block.locator('[data-slot="copy-idle"]')).toHaveText('Copy')
      await expect(pre).toHaveAccessibleDescription(cueText)
      await pre.focus()
      await expect(pre).toHaveCSS('outline-style', 'solid')
      await pre.press('ArrowRight', { delay: 100 })
      await expect.poll(() => pre.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
      await pre.press('Tab')
      await expect(pre).not.toBeFocused()
      await summary.press('Enter')
      await expect(pre).toBeHidden()
      await expect(block.locator('[data-code-preview] pre')).toBeVisible()
      await expect(block.locator('[data-code-preview] pre')).toHaveAccessibleDescription(cueText)
    }

    const ids = await figures.locator('[data-scroll-cue-message]').evaluateAll(cues => cues.map(cue => cue.id))
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)

    await page.setViewportSize({ width: 320, height: 1000 })
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    const headersFit = await figures.locator('figcaption').evaluateAll(headers => headers.every(header => {
      const bounds = header.getBoundingClientRect()

      return Array.from(header.querySelectorAll('button, .ui-code__label')).every(control => {
        const box = control.getBoundingClientRect()

        return box.left >= bounds.left && box.right <= bounds.right && box.bottom <= bounds.bottom
      })
    }))
    expect(headersFit).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('copy failure remains visible and leaves the source available', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Clipboard unavailable')) }
    })
  })
  await page.goto(article)
  const block = page.locator('[data-article-code-folio]').nth(1)
  const copy = block.getByRole('button')
  await expect(copy).toHaveAttribute('data-ui-copy-button-bound', 'true')
  await copy.press('Enter')
  await expect(copy).toHaveAccessibleName('Could not copy code. Select and copy it manually.')
  await expect(block.locator('[data-slot="copy-error"]')).toHaveText('Copy failed')
  await expect(block.locator('[data-slot="copy-error"]')).toBeVisible()
  await expect(block.locator('[data-code-preview] pre')).toContainText('import AxeBuilder')
})

test('imported examples reconnect after navigation with unique descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 })
  await page.goto(article)
  const imported = page.locator('[data-article-code-folio]').nth(1)
  await expect(imported.locator('[data-code-preview] pre')).toHaveAccessibleDescription(cueText)
  await page.getByRole('navigation', { name: 'Page-end navigation', exact: true })
    .getByRole('link', { name: 'Back to Blog', exact: true }).click()
  await expect(page).toHaveURL(/\/blog\/$/u)
  await page.goBack()
  await expect(imported.locator('[data-code-preview] pre')).toHaveAccessibleDescription(cueText)
  await expect(page.locator('[data-article-code-folio] [data-scroll-cue-message]')).toHaveCount(7)
  const ids = await page.locator('[data-article-code-folio] [data-scroll-cue-message]').evaluateAll(cues => cues.map(cue => cue.id))
  expect(new Set(ids).size).toBe(ids.length)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('publishes the complete imported source, filenames, and focusable code', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.goto(article)

    for (const [index, name] of sourceNames.entries()) {
      const block = page.locator('[data-article-code-folio]').nth(index + 1)
      const source = readFileSync(new URL(`./accessibility-guide/${name}.spec.ts`, import.meta.url), 'utf8')
      await block.locator('summary').press('Enter')
      await expect(block.locator('[data-code-complete]')).toBeVisible()
      await expect.poll(() => block.locator('[data-code-complete]').textContent()).toBe(source)
      await expect(block.locator('[data-code-complete]')).toHaveAttribute('tabindex', '0')
      await expect(block.locator('figcaption')).toContainText(`tests/accessibility-guide/${name}.spec.ts`)
      await expect(block.locator('[data-scroll-cue-message]:visible')).toHaveCount(0)
      await block.locator('summary').press('Enter')
      await expect(block.locator('[data-code-preview] pre')).toBeVisible()
    }
  })
})
