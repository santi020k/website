import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const TABLE_ARTICLE = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const CODE_ARTICLE = '/blog/avoid-magic-strings-in-typescript-and-javascript/'

for (const theme of ['light', 'dark'] as const) {
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

test.describe('Article tables without JavaScript', () => {
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
})

const clipboardCases = [
  { outcome: 'resolve', label: 'Copied! Article link copied', visible: 'Copied!', value: `https://santi020k.com${CODE_ARTICLE}` },
  { outcome: 'reject', label: 'Copy link failed. Select and copy the address manually.', visible: 'Copy link', value: null }
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
    await expect(copy).toContainText(visible)
    expect(await page.evaluate(() => sessionStorage.getItem('article-copy-value'))).toBe(value)

    await page.clock.fastForward(2000)
    await expect(copy).toHaveAccessibleName('Copy link to article')
  })
}
