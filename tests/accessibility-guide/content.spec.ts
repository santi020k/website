import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

const guidePath = '/blog/playwright-accessibility-checks-that-teams-keep-running/'

for (const width of [390, 1440]) {
  test(`guide publishes executable examples and a readable checklist at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (value: string) => {
            sessionStorage.setItem('guide-copied-code', value)

            return Promise.resolve()
          }
        }
      })
    })
    await page.goto(guidePath)
    const prose = page.locator('[data-article-prose]')

    for (const example of ['scan', 'dialog', 'skip-link']) {
      const source = readFileSync(new URL(`./${example}.spec.ts`, import.meta.url), 'utf8')
      const block = prose.locator('figure').filter({ has: page.locator('figcaption', {
        hasText: `tests/accessibility-guide/${example}.spec.ts`
      }) })
      await expect(block.locator('[data-code-complete] code')).toHaveText(source)
      const copy = block.getByRole('button')
      await expect(copy).toHaveAccessibleName('Copy code to clipboard')
      await expect(copy).toHaveAttribute('data-ui-copy-button-bound', 'true')
      await copy.press('Enter')
      await expect(copy).toHaveAccessibleName('Code copied to clipboard')
      expect(await page.evaluate(() => sessionStorage.getItem('guide-copied-code'))).toBe(source.trim())
    }

    const checklist = prose.getByRole('heading', { name: 'Keyboard-testing checklist', exact: true })
    await expect(checklist).toHaveAttribute('id', 'keyboard-testing-checklist')
    await expect(prose.getByText('Entry:', { exact: true })).toBeVisible()
    await expect(prose.getByText('Content access:', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const slug of [
  'astro-doctor-announcement',
  'lumen-ui-one-system-three-frameworks',
  'testing-react-components-with-vitest-and-react-testing-library'
]) {
  test(`${slug} links to a reachable guide section`, async ({ page }) => {
    await page.goto(`/blog/${slug}/`)
    const link = page.locator(`[data-article-prose] a[href^="${guidePath}"]`)
    await expect(link).toHaveCount(1)
    await link.click()
    await expect(page).toHaveURL(new RegExp(guidePath))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Playwright Accessibility Checks That Teams Keep Running')
    const fragment = new URL(page.url()).hash
    expect(await page.evaluate(hash => !hash || document.getElementById(hash.slice(1)) !== null, fragment)).toBe(true)
  })
}
