import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const entries = [{ title: 'Astro guide', description: 'Practical Astro notes.', path: '/blog/', tags: ['Astro'], type: 'post' }]
const layouts = [
  ...[320, 390, 768, 1440].map(width => ({ width, height: 1000 })),
  { width: 667, height: 375 }
]

for (const theme of ['light', 'dark'] as const) {
  test(`Recovery folio keeps search failures readable and retryable in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.route('**/search-index.json', route => route.fulfill({ status: 503, body: 'Unavailable' }))
    await page.goto('/resume/?q=Astro')
    const card = page.locator('[data-site-search-recovery]')
    const input = page.locator('#site-search-input')

    await expect(card.getByRole('heading', { name: 'Search unavailable' })).toBeVisible()
    await expect(page.locator('#site-search-status')).toHaveText('Search is temporarily unavailable.')
    for (const layout of layouts) {
      for (const size of [100, 200]) {
        await page.setViewportSize(layout)
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const clipped = await card.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h3, p, button')].some(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            const box = copy.getBoundingClientRect()

            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.top < box.top - 1 || rect.bottom > box.bottom + 1
            ))
          })
        })

        expect(clipped, `Unavailable-state copy must fit at ${layout.width}px / ${size}%`).toBe(false)
        expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
        for (const button of await card.getByRole('button').all()) {
          await button.scrollIntoViewIfNeeded()
          await expect(button).toBeInViewport({ ratio: 1 })
          expect(await button.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
        await expect(page.locator('[data-site-search-close]')).toBeInViewport({ ratio: 1 })
      }
    }
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    expect((await new AxeBuilder({ page }).include('#site-search-dialog').analyze()).violations).toEqual([])

    await input.fill('Astro guide')
    await input.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    await expect(page.locator('[data-site-search-input-clear]')).toBeFocused()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    const retry = card.getByRole('button', { name: 'Try again' })

    await expect(retry).toBeFocused()
    expect(await retry.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none')
    await page.unroute('**/search-index.json')
    await page.route('**/search-index.json', route => route.fulfill({ json: entries }))
    await page.keyboard.press('Enter')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('Astro guide')
    await expect(page).toHaveURL(/\/resume\/\?q=Astro\+guide$/u)
    await expect(page.locator('#site-search-results').getByRole('link', { name: /Astro guide/u })).toBeVisible()
    await expect(card).toHaveCount(0)
    await expect(page.locator('#site-search-status')).toHaveText('1 result available. Use arrow keys to navigate.')
    await page.keyboard.press('Escape')
    await expect(page.locator('#site-search-dialog')).toBeHidden()
  })
}
