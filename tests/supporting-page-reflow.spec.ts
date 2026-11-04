import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const openPage = async (page: Page, route: string, textSize: number) => {
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
  await page.evaluate(() => document.fonts.ready)
}

const tabTo = async (page: Page, target: Locator, browserName: string, backwards = false) => {
  const modifiers = `${backwards ? 'Shift+' : ''}${browserName === 'webkit' ? 'Alt+' : ''}`

  for (let step = 0; step < 160; step++) {
    await page.keyboard.press(`${modifiers}Tab`)
    if (await target.evaluate(element => element === document.activeElement)) return
  }
  throw new Error('The control was not reachable through the page tab order')
}

const expectWholeWords = async (copy: Locator) => {
  const broken = await copy.evaluateAll(elements => elements.flatMap(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const words: string[] = []
    let node = walker.nextNode()

    while (node) {
      for (const match of (node.textContent ?? '').matchAll(/[A-Za-z0-9]+/gu)) {
        const range = document.createRange()

        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)
        const lines = new Set([...range.getClientRects()]
          .filter(rect => rect.width > 0).map(rect => Math.round(rect.y)))

        if (lines.size > 1) words.push(match[0])
      }
      node = walker.nextNode()
    }
    return words
  }))

  expect(broken, 'Control labels and numbers should not break into narrow fragments').toEqual([])
}

const expectReadingWords = async (copy: Locator, width: number) => {
  if (width >= 390) await expectWholeWords(copy)
}

const expectOutline = async (control: Locator) => {
  const outline = await control.evaluate(element => {
    const style = getComputedStyle(element)

    return { width: Number.parseFloat(style.outlineWidth), color: style.outlineColor, style: style.outlineStyle }
  })

  expect(outline.width).toBeGreaterThanOrEqual(2)
  expect(outline.style).toBe('solid')
  expect(outline.color).not.toMatch(/transparent|rgba\([^)]*, 0\)$/u)
}

const expectLoadedLogos = async (logos: Locator) => {
  expect(await logos.count()).toBeGreaterThan(0)
  for (const logo of await logos.all()) {
    await logo.scrollIntoViewIfNeeded()
    await expect(logo).toBeVisible()
    await expect.poll(() => logo.evaluate(element => {
      if (!(element instanceof HTMLImageElement)) return false
      return element.complete && element.naturalWidth > 0
    })).toBe(true)
  }
}

const expectInside = async (elements: Locator) => {
  const outside = await elements.evaluateAll(items => items.flatMap(element => {
    const rect = element.getBoundingClientRect()
    const parent = element.parentElement?.getBoundingClientRect()

    if (!parent) throw new Error('Expected a containing element')
    return rect.left < Math.max(0, parent.left) - 1 || rect.right > Math.min(innerWidth, parent.right) + 1 ?
      [element.textContent || element.getAttribute('src') || element.tagName] :
      []
  }))

  expect(outside, 'Controls and logos must remain inside their containers and the viewport').toEqual([])
}

for (const width of [320, 390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Supporting pages at ${width}px and ${textSize}% in ${theme}`, () => {
        test.use({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test('technology totals and links remain readable and operable', async ({ page, browserName }) => {
          await openPage(page, '/projects/', textSize)
          const snapshot = page.locator('[data-technology-snapshot]')
          const tools = snapshot.locator('[data-technology-ledger] a')

          await expect(snapshot.getByRole('heading', { name: 'Follow the stack.', level: 2 })).toBeVisible()
          await expect(snapshot.locator('[data-technology-snapshot-scope]')).toHaveText(
            '18 selected technologies from 14 personal projects. Each count shows how many of those projects use the tool.'
          )
          await expect(snapshot.locator('dt')).toHaveText('technologies used')
          await expect(snapshot.locator('[data-ui-animated-number-output]')).toHaveText('137')
          await expectWholeWords(snapshot.locator('h2, dt, dd'))
          await expectInside(snapshot.locator('dl > div, a'))
          await expectReadingWords(tools, width)
          await expect(tools).toHaveCount(18)
          await expect(snapshot.getByRole('list', { name: 'Top of mind' }).getByRole('link')).toHaveCount(6)
          await expect(snapshot.getByRole('list', { name: 'In rotation' }).getByRole('link')).toHaveCount(12)
          await expect(snapshot.getByRole('link', { name: 'React Native 1 project', exact: true })).toBeVisible()
          await expect(snapshot.getByRole('link', { name: 'Explore the full technology index', exact: true }))
            .toHaveAttribute('href', '/technologies/')
          await expect(snapshot.locator('a[href="/technologies/"]')).toHaveCount(1)
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
          const react = snapshot.getByRole('link', { name: /^React\.js/ })

          await expect(react).toHaveAccessibleName('React.js 4 projects')
          await tabTo(page, react, browserName)
          await expect(react).toBeFocused()
          await expectOutline(react)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/\/technologies\/react-js\/$/)
          await expect(page.getByRole('heading', { level: 1 })).toContainText('React.js')
        })

        test('organization logos and name controls fit and keep keyboard focus', async ({ page, browserName }) => {
          await openPage(page, '/about/', textSize)
          const carousel = page.locator('[data-organization-carousel]')
          const selectors = carousel.getByRole('navigation', { name: 'Choose an organization' }).getByRole('button')
          const status = carousel.locator('[data-carousel-status]')
          const firstStatus = await status.textContent()

          await expectWholeWords(status)
          await expectInside(carousel.locator('[data-carousel-controls] > *'))
          await expectInside(carousel.locator('[data-carousel-controls] button'))

          // Visit every organization: logos have different aspect ratios and limits.
          const logos = carousel.locator('[data-carousel-item]:visible [data-carousel-logo] > img:not([aria-hidden])')
          const copy = carousel.locator('[data-carousel-item]:visible [data-carousel-copy]')
          const expectReadableSheets = async () => {
            await expectReadingWords(copy, width)
            const clipped = await copy.evaluateAll(sheets => sheets.flatMap(sheet => {
              const bounds = sheet.getBoundingClientRect()

              return [...sheet.children].flatMap(child => {
                const range = document.createRange()

                range.selectNodeContents(child)
                return [...range.getClientRects()].some(rect => rect.width > 0 && (
                  rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
                )) ?
                  [child.textContent] :
                  []
              })
            }))

            expect(clipped, 'Organization names, context, and actions must fit their reading sheets').toEqual([])
          }

          await expectLoadedLogos(logos)
          await expectInside(logos)
          await expectReadableSheets()
          for (const [position, button] of (await selectors.all()).entries()) {
            await tabTo(page, button, browserName)
            await expect(button).toBeFocused()
            await page.keyboard.press('Enter')
            await expect(button).toHaveAttribute('aria-pressed', 'true')
            await expect(carousel.locator('[data-carousel-item]').nth(position)).toBeVisible()
            await expectOutline(button)
            await expectLoadedLogos(logos)
            await expectInside(logos)
            await expectReadableSheets()
          }
          await selectors.first().focus()
          await page.keyboard.press('Enter')
          await expect(status).toHaveText(firstStatus ?? '')
          await expect(selectors.first()).toBeFocused()

          const firstCaseStudy = carousel.getByRole('link', { name: /^Void /u })

          await tabTo(page, firstCaseStudy, browserName, true)
          await expectOutline(firstCaseStudy)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL('/portfolio/void/')
        })

        test('topic cards reflow and announce their count once', async ({ page, browserName }) => {
          await openPage(page, '/blog/tags/', textSize)
          const filter = page.getByRole('searchbox', { name: 'Find a topic' })

          await filter.fill('documentation')
          const topic = page.locator('#tags-list a:visible')

          await expect(topic).toHaveCount(1)
          await expect(topic).toHaveAccessibleName(/^Documentation \d+ posts?$/u)
          await expectInside(topic.locator('[data-topic-name], [data-topic-count]'))
          await expectReadingWords(topic.locator('[data-topic-name]'), width)
          await expect(page.locator('#tag-filter-status')).toContainText('1 topic')
          await tabTo(page, topic, browserName)
          await expect(topic).toBeFocused()
          await expectOutline(topic)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/\/blog\/tags\/documentation\/$/)
          await expect(page.getByRole('heading', { level: 1 })).toContainText('Documentation')
        })

        test('speaking actions and evidence labels keep readable words', async ({ page, browserName }) => {
          await openPage(page, '/speaking/', textSize)
          const actions = page.locator('[data-speaking-community] .section-actions a, [data-speaking-booking] .section-actions a')

          await expectWholeWords(actions)
          await expectInside(actions)
          const timeline = page.locator('[data-speaking-timeline]')
          const evidence = timeline.locator('[data-session-evidence]')
          await expect(evidence).toHaveCount(8)
          await expectReadingWords(evidence, width)
          await expectReadingWords(timeline.locator('[data-session-title], [data-session-tags]'), width)
          await expectInside(timeline.locator('[data-session-evidence], [data-session-tags] > li, [data-session-links] a'))
          const story = page.getByRole('link', { name: 'Read the community story' })

          await tabTo(page, story, browserName)
          await expect(story).toBeFocused()
          await expectOutline(story)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL(/\/portfolio\/react-js-colombia\/$/)
          await expect(page.getByRole('heading', { level: 1 })).toContainText('ReactJS Colombia')
        })
      })
    }
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`supporting surfaces pass accessibility checks with enlarged text in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await openPage(page, '/projects/', 200)
    await expect(page.locator('[data-technology-snapshot]')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.goto('/about/')
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.goto('/speaking/')
    await expectNoUnexpectedAccessibilityViolations(page)
    await page.goto('/blog/tags/')
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}
