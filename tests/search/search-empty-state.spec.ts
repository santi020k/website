import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const entries = [{ title: 'Astro guide', description: 'Practical Astro notes.', path: '/blog/', tags: ['Astro'], type: 'post' }]
const layouts = [
  ...[320, 390, 768, 1440].map(width => ({ width, height: 1000 })),
  { width: 667, height: 375 }
]

for (const theme of ['light', 'dark'] as const) {
  for (const idle of [false, true]) {
    const title = idle ? 'Start typing to search' : 'No results found'

    test(`Recovery folio supports ${idle ? 'an empty index' : 'no matches'} in ${theme}`, async ({ page, browserName }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.route('**/search-index.json', route => route.fulfill({ json: idle ? [] : entries }))
      await page.goto('/')
      await page.locator('[data-site-search-trigger]').click()
      const card = page.locator('[data-site-search-recovery]')
      const input = page.locator('#site-search-input')

      await input.fill(idle ? 'a' : 'nothing-matches')
      await expect(card.getByRole('heading', { name: title })).toBeVisible()
      await expect(page.locator('#site-search-status')).toHaveText(idle ?
        'Type at least two characters to search.' :
        'No matching results for nothing-matches. Try different keywords.')
      for (const layout of layouts) {
        for (const size of [100, 200]) {
          await page.setViewportSize(layout)
          await page.evaluate(async textSize => {
            document.documentElement.style.fontSize = `${textSize}%`
            await document.fonts.ready
          }, size)
          const clipped = await card.evaluate(element => {
            const bounds = element.getBoundingClientRect()
            let previousTextBottom = bounds.top

            return [...element.querySelectorAll('h3, p, button')].some(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              const rects = [...range.getClientRects()].filter(rect => rect.width > 0)
              const clipping = {
                left: Math.max(0, bounds.left),
                right: Math.min(innerWidth, bounds.right),
                top: bounds.top,
                bottom: bounds.bottom
              }

              // Visible font metrics may exceed a heading's line box without clipping.
              for (
                let ancestor: Element | null = copy;
                ancestor && ancestor !== element;
                ancestor = ancestor.parentElement
              ) {
                const style = getComputedStyle(ancestor)
                const box = ancestor.getBoundingClientRect()
                const isButton = ancestor === copy && copy.matches('button')

                if (isButton || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) {
                  clipping.left = Math.max(clipping.left, box.left)
                  clipping.right = Math.min(clipping.right, box.right)
                }
                if (isButton || ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)) {
                  clipping.top = Math.max(clipping.top, box.top)
                  clipping.bottom = Math.min(clipping.bottom, box.bottom)
                }
              }
              const overlaps = Math.min(...rects.map(rect => rect.top)) < previousTextBottom - 1

              previousTextBottom = Math.max(...rects.map(rect => rect.bottom))

              return rects.length === 0 || overlaps || rects.some(rect => (
                rect.left < clipping.left - 1 || rect.right > clipping.right + 1 ||
                rect.top < clipping.top - 1 || rect.bottom > clipping.bottom + 1
              ))
            })
          })

          expect(clipped, `Empty-state copy must fit at ${layout.width}px / ${size}%`).toBe(false)
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

      await input.fill('nothing-matches')
      await expect(card.getByRole('heading', { name: 'No results found' })).toBeVisible()
      await input.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(page.locator('[data-site-search-input-clear]')).toBeFocused()
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(card.getByRole('button', { name: 'Clear search' })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(input).toBeFocused()
      await expect(input).toHaveValue('')
      await expect(page).toHaveURL(/\/$/u)
      await expect(page.locator('#site-search-results')).toContainText(idle ? 'Start typing to search' : 'Popular topics')
      await page.keyboard.press('Escape')
      await expect(page.locator('#site-search-dialog')).toBeHidden()
    })
  }
}
