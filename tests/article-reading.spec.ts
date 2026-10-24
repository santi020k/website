import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const TABLE_ARTICLE = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const CODE_ARTICLE = '/blog/avoid-magic-strings-in-typescript-and-javascript/'
const UPDATE_ARTICLE = '/blog/dep-beacon-vscode-extension/'

// Safari on macOS uses Option-Tab to include links in keyboard navigation.
const nextLinkKeys = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
}

for (const theme of ['light', 'dark'] as const) {
  test(`article updates retain readable text and usable links in ${theme} mode`, async ({ page, browserName }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto(UPDATE_ARTICLE)
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    const note = page.getByRole('complementary', { name: 'September 2026 update' })

    await expect(note).toContainText('This post describes the original VS Code release.')
    await expect(note.getByRole('link')).toHaveCount(3)
    const registry = note.getByRole('link', { name: 'Zed extension registry' })

    await expect(registry).toHaveAttribute('href', 'https://zed.dev/extensions/dep-beacon-lsp')
    await expect(registry).toHaveAttribute('target', '_blank')
    await expect(registry).toHaveAttribute('rel', /noopener/u)
    await expect(registry).toHaveAttribute('rel', /noreferrer/u)
    await registry.focus()
    await expect(registry).toBeFocused()
    await expect(registry).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press(nextLinkKeys[browserName])
    await expect(note.getByRole('link', { name: 'Zed setup guide' })).toBeFocused()
    await page.keyboard.press(nextLinkKeys[browserName])
    await expect(note.getByRole('link', { name: 'why I moved to Zed' })).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const scan = await new AxeBuilder({ page }).include('[data-article-update-note]').analyze()

    expect(scan.violations).toEqual([])
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/why-i-moved-to-zed\/$/u)
  })

  test(`article tables support keyboard scrolling with readable ${theme} text`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto(TABLE_ARTICLE)

    const region = page.locator('[data-prose-table]').first()

    await expect(region).toHaveRole('region')
    await expect(region).toHaveAccessibleName(/^Table 1: /u)
    await expect(region.getByRole('table')).toBeVisible()
    await region.focus()
    await expect(region).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(region).toBeFocused()

    const initial = await region.evaluate(node => ({
      scrollLeft: node.scrollLeft,
      width: node.clientWidth,
      scrollWidth: node.scrollWidth,
      outline: getComputedStyle(node).outlineStyle
    }))

    expect(initial.scrollWidth).toBeGreaterThan(initial.width)
    expect(initial.outline).toBe('solid')
    // WebKit needs a key held across a rendering frame to start native scrolling.
    await page.keyboard.press('ArrowRight', { delay: 100 })
    await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(initial.scrollLeft)

    const scan = await new AxeBuilder({ page }).include('[data-prose-table]').analyze()

    expect(scan.violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test(`article code badges and copy labels are accessible in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto(CODE_ARTICLE)

    const copy = page.locator('.editorial-detail-hero [data-ui-copy-button]')

    await expect(copy).toHaveAccessibleName('Copy link to article')
    await expect(copy).toContainText('Copy link')
    await page.locator('[data-ui-code]').first().scrollIntoViewIfNeeded()

    const scan = await new AxeBuilder({ page }).include('main').options({
      rules: { 'label-content-name-mismatch': { enabled: true } }
    }).analyze()

    expect(scan.violations).toEqual([])
  })
}

test.describe('Article reading without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  test('preserve native table semantics and keyboard scrolling', async ({ page }) => {
    await page.goto(TABLE_ARTICLE)

    const region = page.locator('[data-prose-table]').first()

    await expect(region.getByRole('table')).toBeVisible()
    await region.focus()
    await expect(region).toBeFocused()
    await page.keyboard.press('ArrowRight', { delay: 100 })
    await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
  })

  test('keeps the update note and its destinations available', async ({ page }) => {
    await page.goto(UPDATE_ARTICLE)
    const note = page.getByRole('complementary', { name: 'September 2026 update' })

    await expect(note).toBeVisible()
    await expect(note.getByRole('link')).toHaveCount(3)
    await note.getByRole('link', { name: 'why I moved to Zed' }).click()
    await expect(page).toHaveURL(/\/blog\/why-i-moved-to-zed\/$/u)
  })
})

const clipboardCases = [
  { outcome: 'resolve', label: 'Copied! Article link copied', visible: 'Copied!', value: `https://santi020k.com${CODE_ARTICLE}` },
  { outcome: 'reject', label: 'Copy link failed. Select and copy the address manually.', visible: 'Copy failed', value: null }
]

for (const { outcome, label, visible, value } of clipboardCases) {
  test(`hero copy feedback includes its visible label when clipboard ${outcome}s`, async ({ page }) => {
    await page.addInitScript(result => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (value: string) => {
            if (result === 'reject') return Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError'))

            sessionStorage.setItem('article-copy-value', value)

            return Promise.resolve()
          }
        }
      })
    }, outcome)
    await page.goto(`${CODE_ARTICLE}?source=reading-test#details`)
    await page.clock.install()

    const copy = page.locator('.editorial-detail-hero [data-ui-copy-button]')

    await copy.click()

    await expect(copy).toHaveAccessibleName(label)
    await expect(copy).toHaveText(visible, { useInnerText: true })
    await expect(copy.getByText(visible, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => sessionStorage.getItem('article-copy-value'))).toBe(value)

    await page.clock.fastForward(2000)
    await expect(copy).toHaveAccessibleName('Copy link to article')
  })
}
