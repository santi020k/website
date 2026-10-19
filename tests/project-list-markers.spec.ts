import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  for (const textSize of [100, 150, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Project list markers at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        for (const route of ['/portfolio/lumen-ui/', '/portfolio/optic-power/']) {
          test(`${route} keeps every marker beside its first line`, async ({ page }) => {
            await page.addInitScript(size => {
              const observer = new MutationObserver(() => {
                const root = document.querySelector('html')

                if (!root) return

                root.style.fontSize = `${size}%`
                observer.disconnect()
              })

              observer.observe(document, { childList: true })
            }, textSize)
            await page.goto(route)
            await page.evaluate(async () => {
              await document.fonts.ready
            })
            await expect(page.locator('html')).toHaveCSS('font-size', `${16 * textSize / 100}px`)

            const items = page.locator('.prose-project li')

            expect(await items.count()).toBeGreaterThan(0)
            const problems = await items.evaluateAll(elements => elements.flatMap(element => {
              const style = getComputedStyle(element)
              const marker = getComputedStyle(element, '::before')
              const bounds = element.getBoundingClientRect()
              const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
                acceptNode: node => node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
              })
              const text = walker.nextNode()

              if (!text?.textContent) throw new Error('Expected a nonempty project list item')

              const start = text.textContent.search(/\S/u)
              const range = document.createRange()

              range.setStart(text, start)
              range.setEnd(text, start + 1)
              const firstCharacter = range.getBoundingClientRect()
              const transform = new DOMMatrixReadOnly(marker.transform)
              const center = bounds.top + parseFloat(style.borderTopWidth) + parseFloat(marker.top) +
                parseFloat(marker.height) / 2 + transform.m42
              const offset = Math.abs(center - (firstCharacter.top + firstCharacter.height / 2))
              const aligned = offset <= parseFloat(style.fontSize) * 0.1
              const fits = bounds.left >= 0 && bounds.right <= innerWidth + 1 &&
                element.scrollWidth <= element.clientWidth + 1

              return aligned && fits ? [] : [{ text: element.textContent, offset, fits }]
            }))

            expect(problems).toEqual([])
          })
        }
      })
    }
  }
}
