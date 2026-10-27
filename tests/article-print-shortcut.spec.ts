import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const guide = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const standalone = '/blog/astro-doctor-announcement/'
const medium = '/blog/atomic-module-component-structure-for-react/'
const calls = (page: Page) => page.evaluate(() => Number(sessionStorage.getItem('print-shortcut-calls') ?? 0))

test.beforeEach(async ({ page }) => {
  // Observe delegation without opening an operating-system print dialog in the test runner.
  await page.addInitScript(() => {
    window.print = () => {
      sessionStorage.setItem('print-shortcut-calls', String(Number(sessionStorage.getItem('print-shortcut-calls') ?? 0) + 1))
    }
  })
})

for (const route of [guide, standalone, medium]) {
  test(`one shortcut delegates printing and preserves reading state: ${route}`, async ({ page }) => {
    await page.goto(route)
    const button = page.getByRole('button', { name: 'Print article', exact: true })

    await expect(button).toHaveCount(1)
    await expect(button).toBeVisible()
    await expect(page.locator('[data-publication-reading]').getByRole('button', { name: 'Print article' })).toBeVisible()
    await expect(page.locator('[data-article-utilities] [data-article-print]')).toHaveCount(0)
    const before = await page.locator('[data-example-fold]').evaluateAll(folds => folds.map(fold => fold.hasAttribute('open')))
    const theme = await page.locator('html').getAttribute('data-theme')

    await button.click()
    expect(await calls(page)).toBe(1)
    await expect(page).toHaveURL(route)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme ?? '')
    expect(await page.locator('[data-example-fold]').evaluateAll(folds => folds.map(fold => fold.hasAttribute('open')))).toEqual(before)
    await page.emulateMedia({ media: 'print' })
    await expect(button).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.emulateMedia({ media: 'screen' })
    await expect(button).toBeVisible()
  })
}

test('keyboard activation and client navigation bind each shortcut once', async ({ page }) => {
  await page.goto(guide)
  await page.evaluate(() => {
    document.dispatchEvent(new Event('astro:page-load'))
    document.dispatchEvent(new Event('astro:page-load'))
  })
  const button = page.getByRole('button', { name: 'Print article', exact: true })

  await button.focus()
  await button.press('Enter')
  expect(await calls(page)).toBe(1)
  await expect(button).toBeFocused()
  await button.press('Space')
  expect(await calls(page)).toBe(2)
  await page.locator(`#article-content a[href="${standalone}"]`).click()
  await expect(page).toHaveURL(standalone)
  await page.getByRole('button', { name: 'Print article', exact: true }).click()
  expect(await calls(page)).toBe(3)
  await page.goBack()
  await expect(page).toHaveURL(guide)
  await button.click()
  expect(await calls(page)).toBe(4)
})

for (const theme of ['light', 'dark'] as const) {
  test(`hover and keyboard emphasis remain accessible with reduced motion: ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' })
    await page.goto(guide)
    // The approved hero entrance moves and fades this group; inspect its settled state.
    await page.locator('[data-editorial-meta-group]').evaluate(async element => {
      await document.fonts.ready
      await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
    })
    const button = page.getByRole('button', { name: 'Print article', exact: true })
    const icon = button.locator('svg')

    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await button.hover()
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(button.locator('[data-print-label]')).toHaveCSS('text-decoration-line', 'underline')
    await expect(icon).toHaveCSS('transform', 'none')
    await page.mouse.move(0, 0)
    await button.press('Tab')
    await button.focus()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await button.evaluate(async element => {
      await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
    })
    const scan = await new AxeBuilder({ page }).include('[data-publication-imprint]').analyze()

    expect(scan.violations).toEqual([])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await button.hover()
    await expect(icon).toHaveCSS('transform', 'none')
    await expect(button).toHaveCSS('transition-property', 'none')
  })
}

test('without JavaScript the hidden shortcut does not leave an inert control', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  await page.goto(guide)
  await expect(page.locator('[data-article-print]')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Print article', exact: true })).toHaveCount(0)
  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await context.close()
})

test('without browser print support the shortcut stays hidden', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'print', { configurable: true, value: undefined })
  })
  await page.goto(guide)
  await expect(page.locator('[data-article-print]')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Copy link to article', exact: true })).toBeVisible()
})
