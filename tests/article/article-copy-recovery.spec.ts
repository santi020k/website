import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const nextTab = (browserName: string) => browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (source: string) => {
          if (sessionStorage.getItem('copy-recovery-outcome') !== 'resolve') {
            return Promise.reject(new DOMException('Clipboard denied for test', 'NotAllowedError'))
          }

          sessionStorage.setItem('copy-recovery-source', source)

          return Promise.resolve()
        }
      }
    })
  })
})

for (const { name, route, selector, expandedCount } of [
  { name: 'short Markdown', route: '/blog/avoid-magic-strings-in-typescript-and-javascript/', selector: '[data-article-code-folio]', expandedCount: 0 },
  { name: 'folded Markdown', route: '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/', selector: '[data-article-code-folio]:has([data-example-fold])', expandedCount: 1 },
  { name: 'imported source', route: guide, selector: '[data-article-code-folio]:has([data-example-fold])', expandedCount: 1 }
]) {
  test(`selects complete ${name} after denial and removes recovery after a successful retry`, async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(route)
    const figure = page.locator(selector).first()
    const copy = figure.locator('[data-ui-code-copy]')
    const pre = figure.locator('pre').first()
    const source = await copy.getAttribute('data-copy-value') ?? await pre.innerText()
    expect(source.trim()).not.toBe('')
    await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
    await page.clock.install()
    await copy.click()
    await expect(copy).toHaveAttribute('data-state', 'error')
    await expect(figure.locator('details[open]')).toHaveCount(0)
    await expect(page.locator('[data-code-recovery]')).toHaveCount(1)
    await page.clock.fastForward(5000)
    await expect(copy).toHaveAttribute('data-state', 'idle')

    const select = figure.getByRole('button', { name: 'Select code', exact: true })
    await expect(select).toBeVisible()
    const tab = nextTab(browserName)
    await copy.press(tab)
    await expect(select).toBeFocused()
    await expect(select).toHaveCSS('outline-style', 'solid')
    await select.press('Enter')
    await expect(pre).toBeFocused()
    await expect(pre).toBeInViewport()
    await expect(figure.locator('details[open]')).toHaveCount(expandedCount)
    expect(await page.evaluate(() => window.getSelection()?.toString().trimEnd())).toBe(source.trimEnd())
    await expect(figure.getByRole('status')).toHaveText('Code selected. Use your keyboard or device menu to copy.')
    expect(await pre.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(96)
    await pre.press(tab)
    await expect(pre).not.toBeFocused()

    await page.evaluate(() => {
      sessionStorage.setItem('copy-recovery-outcome', 'resolve')
    })
    await copy.click()
    await expect(copy).toHaveAttribute('data-state', 'copied')
    await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
    expect(await page.evaluate(() => sessionStorage.getItem('copy-recovery-source'))).toBe(source)

    await page.evaluate(() => {
      sessionStorage.setItem('copy-recovery-outcome', 'reject')
      document.dispatchEvent(new Event('astro:page-load'))
    })
    await copy.click()
    await copy.click()
    await expect(page.locator('[data-code-recovery]')).toHaveCount(1)
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`copy failure and recovery remain accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(guide)
    const figure = page.locator('[data-article-code-folio]').first()
    await page.clock.install()
    await figure.locator('[data-ui-code-copy]').click()
    await expect(figure.locator('[data-code-recovery]')).toBeVisible()
    const results = await new AxeBuilder({ page }).include('[data-article-code-folio]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations).toEqual([])
  })

  for (const width of [320, 1440]) {
    test(`recovery fits enlarged text at ${width}px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: theme })
      await page.goto(guide)
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
      const figure = page.locator('[data-article-code-folio]').first()
      await figure.locator('[data-ui-code-copy]').click()
      const select = figure.getByRole('button', { name: 'Select code', exact: true })
      await expect(select).toBeVisible()
      expect(await select.evaluate(element => {
        const button = element.getBoundingClientRect()
        const card = element.closest('figure')?.getBoundingClientRect()
        return card && button.height >= 44 && button.left >= card.left && button.right <= card.right
      })).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const source = await figure.locator('pre').innerText()
      await select.click()
      expect(await page.evaluate(() => window.getSelection()?.toString().trimEnd())).toBe(source.trimEnd())
    })
  }
}

test('missing clipboard support offers recovery and print hides it', async ({ page }) => {
  await page.goto(guide)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  const figure = page.locator('[data-article-code-folio]').first()
  await figure.locator('[data-ui-code-copy]').click()
  await expect(figure.locator('[data-code-recovery]')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(figure.locator('[data-code-recovery]')).toBeHidden()
  await expect(figure.locator('pre')).toBeVisible()
})

test('code without JavaScript remains readable without inactive recovery controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(guide)
  await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
  await expect(page.locator('[data-article-code-folio]').first().locator('pre')).toBeVisible()
  await context.close()
})
