import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/blog/responsive-design-standards-that-scale-across-components/'
const lead = 'Responsive design gets messy when teams treat it as a collection of isolated fixes. ' +
  'One component gets a mobile override. Another gets a one-off breakpoint. A third changes spacing with ' +
  'a totally different logic. Everything still renders, but the system stops feeling predictable.'

test.use({ reducedMotion: 'reduce' })

for (const width of [320, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`Margin lead retains the article opening at ${width}px, ${textSize}% text, ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto(route)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        const opening = page.locator('[data-article-margin-lead]')

        await expect(opening).toHaveCount(1)
        await expect(opening.locator('[data-article-format]')).toHaveText('Deep Dive')
        await expect(opening.locator('[data-article-lead]')).toHaveText(lead)
        await expect(page.locator('.e-content [data-content-notes]')).toHaveCount(0)
        await expect(page.getByText(lead, { exact: true })).toHaveCount(1)
        await expect(page.locator('[data-article-margin-lead] + p')).toHaveText(
          'I prefer a different approach: treat responsiveness like a shared design language.'
        )
        const layout = await opening.evaluate(element => {
          const format = element.querySelector('[data-article-format]')?.getBoundingClientRect()
          const paragraph = element.querySelector('[data-article-lead]')?.getBoundingClientRect()

          if (!format || !paragraph) throw new Error('Expected the format and opening paragraph')
          const stackThreshold = 32 * parseFloat(getComputedStyle(document.documentElement).fontSize)

          return {
            labelAbove: format.bottom <= paragraph.top,
            labelBeside: format.right < paragraph.left,
            stacked: element.getBoundingClientRect().width < stackThreshold,
            fits: paragraph.right <= innerWidth && paragraph.left >= 0,
            noOverflow: document.documentElement.scrollWidth <= innerWidth
          }
        })

        expect(layout.fits && layout.noOverflow).toBe(true)
        expect(layout.stacked ? layout.labelAbove : layout.labelBeside).toBe(true)
        await expectNoUnexpectedAccessibilityViolations(page)
      })
    }
  }
}

test('an MDX update stays before its original opening without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } })
  const page = await context.newPage()

  await page.goto('/blog/dep-beacon-vscode-extension/')
  const opening = page.locator('[data-article-margin-lead]')

  await expect(opening.locator('[data-article-format]')).toHaveText('Case Study')
  await expect(opening.locator('[data-article-lead]')).toHaveText('Dependency maintenance has a strange shape.')
  expect(await opening.evaluate(element => {
    const note = document.querySelector('.e-content aside')

    return note !== null && Boolean(note.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
  })).toBe(true)
  await expect(page.locator('.e-content aside').getByRole('link', { name: 'Zed setup guide' })).toHaveAttribute(
    'href', 'https://beacon.santi020k.com/docs/zed-extension'
  )
  await context.close()
})
