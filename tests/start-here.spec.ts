import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

test('curated reading complements recent writing and opens a real article', async ({ page }) => {
  await page.goto('/')
  const curated = page.getByRole('region', { name: 'Start here', exact: true })
  const links = curated.getByRole('link')
  await expect(links).toHaveCount(3)
  await expect(links).toContainText(['How I build', 'How I think', 'Why I make things'])
  const covers = curated.getByRole('img')
  await expect(covers).toHaveCount(3)
  for (const cover of await covers.all()) {
    await cover.scrollIntoViewIfNeeded()
    await expect(cover).toHaveAttribute('alt', /\S/u)
    await expect.poll(() => cover.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) return false

      return element.complete && element.naturalWidth > 0
    })).toBe(true)
  }
  await expect(page.getByRole('list', { name: 'Latest writing' }).getByRole('link')).toHaveCount(4)
  await expect(page.getByRole('link', { name: 'Follow via RSS' })).toHaveAttribute('href', '/feed.xml')
  await links.last().focus()
  await expect(links.last()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/blog\/why-i-built-between-contractions\/$/u)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I Built Between Contractions')
})

for (const theme of ['light', 'dark']) {
  test(`reading recommendations keep complete copy and visible focus in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Start here', exact: true })
    const cards = section.getByRole('article')
    await expect(cards).toHaveCount(3)

    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const textSize of ['100%', '200%']) {
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = value
          await document.fonts.ready
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
            resolve()
          })))
        }, textSize)
        for (const card of await cards.all()) {
          const link = card.getByRole('link')
          await link.scrollIntoViewIfNeeded()
          await link.focus()
          await expect(link).toBeFocused()
          await expect(link).toBeInViewport()
          await expect(link).not.toHaveCSS('outline-style', 'none')
          const bounds = await card.boundingBox()
          expect(bounds).not.toBeNull()
          expect(bounds?.x).toBeGreaterThanOrEqual(0)
          expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
          for (const copy of await card.locator('h4, p, [data-reading-slip-footer] > span').all()) {
            // Measure the words themselves: the footer arrow keeps its next glyph outside
            // its own box, clipped from view, which still counts toward scroll sizes.
            const clipped = await copy.evaluate(element => {
              const box = element.getBoundingClientRect()
              const words = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
              const range = document.createRange()

              for (let node = words.nextNode(); node; node = words.nextNode()) {
                if (!node.textContent?.trim() || node.parentElement?.closest('[aria-hidden="true"]')) continue

                range.selectNodeContents(node)

                for (const rect of range.getClientRects()) {
                  const outsideX = rect.left < box.left - 1 || rect.right > box.right + 1
                  const outsideY = rect.top < box.top - 1 || rect.bottom > box.bottom + 1

                  if (outsideX || outsideY) return true
                }
              }

              return element.scrollWidth > element.clientWidth + 1
            })

            expect(clipped).toBe(false)
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test.describe('Start here without client JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('keeps complete recommendations and native article navigation', async ({ page }) => {
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Start here', exact: true })
    await expect(section.getByRole('link')).toHaveCount(3)
    await expect(section.getByRole('heading', { level: 4 })).toHaveCount(3)
    await expect(section.getByRole('img')).toHaveCount(3)
    await section.getByRole('link').last().click()
    await expect(page).toHaveURL(/\/blog\/why-i-built-between-contractions\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I Built Between Contractions')
  })
})
