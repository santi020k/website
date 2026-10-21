import { expect, type Locator, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const openWithTextSize = async (page: Page, route: string, textSize: number) => {
  // Apply the reading preference before layout, as in the other responsive suites.
  // Changing the root after load can keep reflowing beyond two animation frames.
  await page.addInitScript(size => {
    const apply = () => {
      const root = document.querySelector('html')

      if (!root) return false
      root.style.fontSize = `${size}%`
      return true
    }

    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
  }, textSize)
  await page.goto(route)
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  })
}

const expectWholeText = async (locator: Locator, pattern: RegExp) => {
  const split = await locator.evaluateAll((elements, expression) => elements.flatMap(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const failures: string[] = []
    let node = walker.nextNode()

    while (node) {
      for (const match of (node.textContent ?? '').matchAll(new RegExp(expression.source, expression.flags))) {
        const range = document.createRange()

        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)
        if (range.getClientRects().length > 1) failures.push(match[0])
      }
      node = walker.nextNode()
    }
    return failures
  }), { source: pattern.source, flags: `${pattern.flags}g` })

  expect(split).toEqual([])
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 150, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Remaining affordances at ${width}px, ${textSize}% text, ${theme}`, () => {
        test.use({ viewport: { width, height: 844 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('home statistics stay inside their columns and discovery rows remain readable', async ({ page, browserName }) => {
          await openWithTextSize(page, '/', textSize)
          const stats = page.locator('.studio-stat')

          await expect(stats).toHaveCount(4)
          const outside = await stats.evaluateAll(elements => elements.flatMap(element => {
            const bounds = element.getBoundingClientRect()
            const value = element.querySelector('.studio-stat-value')
            const rect = value?.getBoundingClientRect()

            return !rect || rect.left < bounds.left - 1 || rect.right > bounds.right + 1 ? [value?.textContent] : []
          }))

          expect(outside).toEqual([])
          await expectWholeText(page.locator('.studio-writing-row h4'), /authentication|without|sharing|accounts/u)
          await expectWholeText(page.locator('.studio-row-title strong'), /RoadScore|Between/u)
          const rows = page.locator('.studio-writing-row')
          const first = rows.first()
          const href = requireValue(await first.getAttribute('href'))

          await first.focus()
          await expect(first).toBeFocused()
          await expect(first).toHaveCSS('outline-style', 'solid')
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          await expect(rows.nth(1)).toBeFocused()
          await first.focus()
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(href)
        })

        if (width === 390 && textSize > 100) {
          test('home project copy uses the space beneath its decorative arrow', async ({ page }) => {
            await openWithTextSize(page, '/', textSize)
            const cramped = await page.locator('.studio-project-row').evaluateAll(elements => elements.flatMap(element => {
              const title = element.querySelector('.studio-row-title')?.getBoundingClientRect()
              const icon = element.querySelector('[data-project-row-icon]')?.getBoundingClientRect()

              return !title || !icon || title.right < icon.right - 1 ? [element.textContent] : []
            }))

            expect(cramped).toEqual([])
          })
        }

        test('supporting headings, history chapters, and speaker facts fit enlarged reading columns', async ({ page }) => {
          for (const route of [
            '/developer-experience/',
            '/technologies/',
            '/blog/tags/',
            '/speaking/',
            '/offline/',
            '/privacy/',
            '/terms/',
            '/accessibility/',
            '/history/'
          ]) {
            await openWithTextSize(page, route, textSize)
            await expectWholeText(page.getByRole('heading', { level: 1 }), /\b[a-z]{4,}\b/iu)
          }

          const chapters = page.getByRole('navigation', { name: 'Jump to a design era' })
          const outside = await chapters.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.children].filter(child => {
              const rect = child.getBoundingClientRect()

              return rect.left < bounds.left - 1 || rect.right > bounds.right + 1
            }).map(child => child.textContent)
          })

          expect(outside).toEqual([])
          const thirdChapter = chapters.locator('a[href="#v3"]')

          await thirdChapter.focus()
          await expect(thirdChapter).toBeFocused()
          await expect(thirdChapter).toBeInViewport()
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/#v3$/u)
          await expect(page.locator('#v3')).toBeInViewport()
          await openWithTextSize(page, '/speaking/', textSize)
          const facts = page.getByRole('complementary', { name: 'Speaker profile' }).locator('dl')

          await expect(facts.locator('dt')).toHaveCount(2)
          await expectWholeText(facts, /Community|Medellín/u)
        })

        test('technology labels and counts remain legible while filtering with the keyboard', async ({ page, browserName }) => {
          await openWithTextSize(page, '/technologies/', textSize)
          for (const name of ['Core', 'Regular', 'Selective']) {
            await expect(page.getByRole('heading', { name: new RegExp(`^${name} \\d+ tools?$`, 'u') })).toBeVisible()
          }
          const items = page.locator('[data-technology-item]')

          expect(await items.count()).toBeGreaterThan(100)
          await expectWholeText(items, /^\d+$/u)
          await expectWholeText(page.locator('[data-site-pill-label]'), /React\.js|TypeScript/u)
          const search = page.getByRole('searchbox', { name: 'Find a technology' })

          await search.fill('typescript')
          await expect(page.locator('[data-technology-item]:visible')).toHaveCount(1)
          await expect(page.locator('#technology-filter-status')).toHaveText('1 technology found.')
          await expect(page.getByRole('region', { name: 'Core 1 tool', exact: true })).toBeVisible()
          await expect(page.getByRole('heading', { name: 'Core 1 tool', exact: true })).toBeVisible()
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          const result = page.locator('[data-technology-item]:visible a')
          const href = requireValue(await result.getAttribute('href'))

          await expect(result).toBeFocused()
          await expect(result).toBeInViewport()
          await expect(result).toHaveCSS('outline-style', 'solid')
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(href)
        })
      })
    }
  }
}

for (const width of [640, 768, 840, 959]) {
  test(`history fills all four tablet chapter columns at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWithTextSize(page, '/history/', 100)
    const chapters = page.getByRole('navigation', { name: 'Jump to a design era' })
    const links = chapters.getByRole('link')

    await expect(links).toHaveCount(4)
    // The centered links have different heights when a date wraps. They must
    // share a row, but their top edges need not match.
    const rowOverlap = await links.evaluateAll(elements => {
      const bounds = elements.map(element => element.getBoundingClientRect())

      return Math.min(...bounds.map(rect => rect.bottom)) - Math.max(...bounds.map(rect => rect.top))
    })
    const bounds = requireValue(await chapters.boundingBox())
    const last = requireValue(await links.last().boundingBox())

    expect(rowOverlap).toBeGreaterThan(0)
    expect(Math.abs(last.x + last.width - bounds.x - bounds.width)).toBeLessThanOrEqual(1)
  })
}
