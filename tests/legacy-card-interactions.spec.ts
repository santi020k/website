import { expect, type Locator, type Page, test } from '@playwright/test'

const setTextSize = async (page: Page, textSize: number) => {
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
}

const expectWholeWords = async (copy: Locator) => {
  const broken = await copy.evaluateAll(elements => elements.flatMap(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const words: string[] = []
    let node = walker.nextNode()

    while (node) {
      for (const match of (node.textContent ?? '').matchAll(/[A-Za-z]+/gu)) {
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

  expect(broken, 'Card padding must leave room for ordinary words at enlarged text sizes').toEqual([])
}

const hoverAppearance = (card: Locator) => card.evaluate(element => [
  element,
  ...element.querySelectorAll('[data-principle-index], [data-principle-title], [data-testimonial-quote], [data-slot="avatar"]')
].map(node => {
  const style = getComputedStyle(node)

  return { color: style.color, transform: style.transform, spacing: style.letterSpacing, shadow: style.boxShadow }
}))

const expectNewsletterLayout = async (newsletter: Locator, stacked: boolean, wide = false) => {
  const button = newsletter.getByRole('button', { name: 'Get new posts' })
  // Native focus can still be scrolling; read all boxes in the same frame.
  const { field, action, form } = await newsletter.evaluate(element => {
    const input = element.querySelector('input[type="email"]')
    const submit = element.querySelector('button')
    const form = element.querySelector('form')
    const bounds = (node: Element) => {
      const rect = node.getBoundingClientRect()

      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    }

    if (!input || !submit || !form) throw new Error('Newsletter controls need rendered boxes')
    return { field: bounds(input), action: bounds(submit), form: bounds(form) }
  })

  expect(field.width).toBeGreaterThan(150)
  if (stacked) {
    expect(field.width).toBeGreaterThanOrEqual(form.width - 1)
    expect(action.y).toBeGreaterThanOrEqual(field.y + field.height)
    await expect(button.locator('[data-newsletter-submit-label]')).toBeVisible()
  } else {
    expect(action.x).toBeGreaterThanOrEqual(field.x + field.width)
    expect(Math.abs(action.y - field.y)).toBeLessThan(1)
    if (wide) await expect(button.locator('[data-newsletter-submit-label]')).toBeVisible()
  }
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    test.describe(`Legacy cards at ${width}px and ${textSize}% text`, () => {
      test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'no-preference' })

      for (const theme of ['light', 'dark'] as const) {
        test(`passive cards keep their typography and decoration still in ${theme}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: theme })
          await setTextSize(page, textSize)
          for (const [route, selector] of [
            ['/about/', '[data-principle], [data-testimonial]'],
            ['/developer-experience/', '[data-principle]'],
            ['/speaking/', '[data-talk-card]']
          ] as const) {
            await page.goto(route)
            await page.evaluate(() => document.fonts.ready)
            const cards = page.locator(selector)

            expect(await cards.count()).toBeGreaterThan(0)
            for (const card of await cards.all()) {
              await card.scrollIntoViewIfNeeded()
              await expect(card).toHaveCSS('opacity', '1')
              await page.mouse.move(0, 0)
              const before = await hoverAppearance(card)

              await card.hover()
              await card.evaluate(async element => {
                await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
              })
              expect(await hoverAppearance(card)).toEqual(before)
            }
          }
        })

        test(`series and newsletter remain readable and keyboard usable in ${theme}`, async ({ page, browserName }) => {
          await page.emulateMedia({ colorScheme: theme })
          await setTextSize(page, textSize)
          await page.goto('/blog/')
          await page.evaluate(() => document.fonts.ready)
          const series = page.locator('[data-series-card]')

          expect(await series.count()).toBeGreaterThan(0)
          await expectWholeWords(series.locator('h3, [data-site-pill-label]'))
          await page.keyboard.press('Tab')
          for (const title of await series.locator('h3 a').all()) {
            await title.focus()
            await expect(title).toHaveCSS('outline-style', 'solid')
            expect(await title.evaluate(element => element.getClientRects().length),
              'Wrapped titles retain one continuous focus border').toBe(1)
          }
          const newsletter = page.locator('[data-newsletter]')
          const email = newsletter.getByRole('textbox', { name: 'Email address' })
          const button = newsletter.getByRole('button', { name: 'Get new posts' })

          await expectWholeWords(newsletter.locator('h3'))
          await page.keyboard.press('Tab')
          for (const forcedColors of ['none', 'active'] as const) {
            await page.emulateMedia({ forcedColors })
            for (const control of [newsletter.getByRole('link', { name: 'RSS' }), email, button, newsletter.getByRole('link', { name: 'Privacy' })]) {
              await control.focus()
              await expect(control).toBeFocused()
              await expect(control).toHaveCSS('outline-style', 'solid')
              const metrics = await control.evaluate(element => {
                const bounds = element.getBoundingClientRect()
                const card = element.closest('[data-newsletter]')?.getBoundingClientRect()
                const style = getComputedStyle(element)
                const outset = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth)

                return {
                  outline: parseFloat(style.outlineWidth),
                  contained: card !== undefined &&
                    bounds.left - outset >= card.left && bounds.right + outset <= card.right
                }
              })

              expect(metrics.outline).toBeGreaterThanOrEqual(2)
              expect(metrics.contained).toBe(true)
            }
          }
          await email.focus()
          await email.fill('synthetic-audit-test@example.invalid')
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
          await expect(button).toBeFocused()
          await expectNewsletterLayout(newsletter, width === 390 && textSize === 200, width === 1440)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        })
      }

      test('tall reveal groups show every card with animation enabled', async ({ page }) => {
        test.setTimeout(60_000)
        await setTextSize(page, textSize)
        for (const route of ['/speaking/', '/blog/series/', '/blog/', '/developer-experience/', '/portfolio/', '/portfolio/lumen-ui/', '/privacy/', '/terms/', '/accessibility/']) {
          await page.goto(route)
          await page.evaluate(() => document.fonts.ready)
          const groups = page.locator('[data-ui-reveal-group]')

          expect(await groups.count()).toBeGreaterThan(0)
          for (const group of await groups.all()) {
            const children = group.locator(':scope > *')

            // Jump to the last item, as a keyboard or in-page navigation can do.
            // Observing a percentage of the whole group cannot reveal a tall list.
            await children.last().scrollIntoViewIfNeeded()
            for (const child of await children.all()) {
              await expect(child, `${route}: card must be painted, not just have a box`).toHaveCSS('opacity', '1')
            }
          }
        }
      })
    })
  }
}

test('newsletter submit label stays inside the button at 320px with enlarged text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await setTextSize(page, 200)
  await page.goto('/blog/')
  await page.evaluate(() => document.fonts.ready)
  const newsletter = page.locator('[data-newsletter]')
  const button = newsletter.getByRole('button', { name: 'Get new posts' })

  await expectNewsletterLayout(newsletter, true)
  const fits = await button.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return [...element.querySelectorAll('span')].every(span => {
      const child = span.getBoundingClientRect()

      return child.left >= bounds.left && child.right <= bounds.right &&
        child.top >= bounds.top && child.bottom <= bounds.bottom
    })
  })

  expect(fits).toBe(true)
})
