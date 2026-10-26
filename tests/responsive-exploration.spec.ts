import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const openPage = async (page: Page, route: string, size = '200%') => {
  await page.addInitScript(fontSize => {
    const apply = () => {
      const root = document.querySelector('html')

      if (!root) return false

      root.style.fontSize = fontSize

      return true
    }

    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
  }, size)
  await page.goto(route)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].filter(image => image.loading === 'eager').map(image => image.decode()))
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  })
}

// The document hides horizontal overflow, so checking scrollWidth alone misses
// clipped copy. Measure rendered text fragments against the visible screen.
const expectTextOnScreen = async (locator: Locator) => {
  const outside = await locator.evaluateAll(elements => elements.flatMap(element => {
    if (!element.checkVisibility()) return []

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const failures: { text: string, left: number, right: number }[] = []
    let node = walker.nextNode()

    while (node) {
      if (node.textContent?.trim() && !node.parentElement?.closest('.sr-only')) {
        const range = document.createRange()

        range.selectNodeContents(node)

        for (const rect of range.getClientRects()) {
          if (rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)) {
            failures.push({ text: node.textContent.trim(), left: rect.left, right: rect.right })
          }
        }
      }

      node = walker.nextNode()
    }

    return failures
  }))

  expect(outside).toEqual([])
}

const expectWordsUnbroken = async (locator: Locator) => {
  const splitWords = await locator.evaluateAll(elements => elements.flatMap(heading => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
    const split: string[] = []
    let node = walker.nextNode()

    while (node) {
      // Ordinary words should stay intact; package identifiers such as
      // @santi020k/og may break across lines at narrow reading widths.
      for (const match of (node.textContent ?? '').matchAll(/(?<!\S)[a-z]+(?=[.!?]?(?:\s|$))/giu)) {
        const range = document.createRange()

        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)

        if (range.getClientRects().length > 1) split.push(match[0])
      }

      node = walker.nextNode()
    }

    return split
  }))

  expect(splitWords).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Responsive exploration in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const width of [320, 375, 768, 1440]) {
      test(`About copy and cards remain readable at ${width}px with enlarged text`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await openPage(page, '/about/')
        await expectTextOnScreen(page.locator('.about-page h1, .about-page h2, .about-page h3, .about-page p, .about-link, .about-portrait figcaption, .about-page [data-testimonial-author]'))
        await expectWordsUnbroken(page.locator('[data-about-hero-heading]'))

        const layouts = await page.locator('.about-stats, .about-lanes, .about-principles').evaluateAll(groups => groups.map(group => {
          const children = [...group.children].map(child => child.getBoundingClientRect())

          return children.every(rect => rect.width >= Math.min(260, group.clientWidth) - 1)
        }))

        expect(layouts.every(Boolean)).toBe(true)
        await page.getByRole('link', { name: 'See all LinkedIn recommendations', exact: true }).focus()
        await expect(page.getByRole('link', { name: 'See all LinkedIn recommendations', exact: true })).toBeInViewport({ ratio: 1 })
      })

      for (const route of ['/projects/', '/portfolio/']) {
        test(`${route} retains complete titles and metadata at ${width}px with enlarged text`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await openPage(page, route)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
          await expectTextOnScreen(page.locator('main h1, main h2, main h3, .projects-intro-paths, .projects-intro-footer, .projects-editorial-copy, [data-portfolio-project]'))
          await expectWordsUnbroken(page.locator('.projects-editorial-copy h3'))
        })
      }

      for (const size of ['100%', '200%']) {
        test(`travel details and controls stay reachable at ${width}px and ${size} text`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await openPage(page, '/travel/', size)
          const chooser = page.locator('[data-ui-world-map-select]')
          const panel = page.locator('[data-travel-selection]')
          const close = page.getByRole('button', { name: 'Close country details' })
          const next = page.getByRole('button', { name: /^Next country/u })

          await chooser.selectOption('MX')
          await expect(panel).toBeVisible()
          await expectWordsUnbroken(page.locator('[data-travel-country]'))
          const geometry = await panel.evaluate(element => {
            const atlas = element.closest('[data-travel-atlas]')?.getBoundingClientRect()
            const bounds = element.getBoundingClientRect()

            return { top: bounds.top, atlasTop: atlas?.top, client: element.clientWidth, scroll: element.scrollWidth }
          })

          expect(geometry.atlasTop).toBeDefined()
          expect(geometry.top).toBeGreaterThanOrEqual(geometry.atlasTop ?? Infinity)
          expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1)
          await expectTextOnScreen(page.locator('[data-travel-country], [data-travel-counts], [data-travel-next]'))

          for (const control of [close, page.locator('[data-travel-previous]'), next]) {
            await control.focus()
            await expect(control).toBeInViewport({ ratio: 1 })
            const size = await control.evaluate(element => {
              const bounds = element.getBoundingClientRect()

              return {
                width: bounds.width,
                height: bounds.height,
                unobscured: element.contains(document.elementFromPoint(
                  bounds.left + bounds.width / 2,
                  bounds.top + bounds.height / 2
                ))
              }
            })

            expect(size.width).toBeGreaterThanOrEqual(44)
            expect(size.height).toBeGreaterThanOrEqual(44)
            expect(size.unobscured).toBe(true)
          }

          await next.press('Enter')
          await expect(panel).toContainText('Guatemala')
          await close.focus()
          await close.press('Enter')
          await expect(panel).toBeHidden()
          await expect(page.locator('[data-ui-world-map-viewport]')).toBeFocused()
          await expect(chooser).toHaveValue('')

          for (const control of await page.locator('[data-ui-world-map-zoom="in"], [data-ui-world-map-zoom="out"], [data-ui-world-map-zoom="reset"]').all()) {
            const box = await control.boundingBox()

            expect(box).not.toBeNull()
            expect(box?.x).toBeGreaterThanOrEqual(0)
            expect((box?.x ?? Infinity) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
          }
        })
      }
    }

    test('mobile topic pills keep their complete keyboard focus outline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 })
      await openPage(page, '/blog/', '100%')
      const row = page.locator('[data-blog-tag-filter]')
      const pill = row.getByRole('link').first()

      await pill.focus()
      const clipped = await pill.evaluate(element => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const extent = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
        const outline = {
          left: box.left - extent,
          right: box.right + extent,
          top: box.top - extent,
          bottom: box.bottom + extent
        }

        if (style.outlineStyle === 'none' || parseFloat(style.outlineWidth) < 2 ||
          outline.left < 0 || outline.right > innerWidth ||
          outline.top < 0 || outline.bottom > innerHeight) return true

        // Wrapping topic rows allow visible overflow. Only a clipping ancestor
        // can cut off an outline extending outside the row's content box.
        let ancestor = element.parentElement

        while (ancestor) {
          const bounds = ancestor.getBoundingClientRect()
          const ancestorStyle = getComputedStyle(ancestor)
          const clips = ['hidden', 'clip', 'auto', 'scroll']

          if (clips.includes(ancestorStyle.overflowX) &&
            (outline.left < bounds.left - 1 || outline.right > bounds.right + 1)) return true
          if (clips.includes(ancestorStyle.overflowY) &&
            (outline.top < bounds.top - 1 || outline.bottom > bounds.bottom + 1)) return true
          ancestor = ancestor.parentElement
        }
        return false
      })

      expect(clipped).toBe(false)
      await row.getByRole('link').last().focus()
      await expect(row.getByRole('link').last()).toBeInViewport({ ratio: 1 })
    })

    for (const size of ['100%', '200%']) {
      test(`History chapter links use one header clearance with ${size} text`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 600 })
        await openPage(page, '/history/', size)
        await page.getByRole('navigation', { name: 'Jump to a design era' }).locator('a[href="#v1"]').click()
        await expect.poll(async () => page.locator('#v1').evaluate(element => Math.abs(element.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)))).toBeLessThanOrEqual(1)
      })
    }

    test('travel selected state passes an accessibility audit with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await openPage(page, '/travel/')
      await page.locator('[data-ui-world-map-select]').selectOption('MX')
      await expect(page.locator('[data-travel-selection]')).toBeVisible()
      const hintOverlapsDetails = await page.locator('[data-travel-hint]').evaluate(element => {
        const hint = element.getBoundingClientRect()
        const panel = document.querySelector('[data-travel-selection]')?.getBoundingClientRect()

        return !panel || (hint.left < panel.right && hint.right > panel.left &&
          hint.top < panel.bottom && hint.bottom > panel.top)
      })

      expect(hintOverlapsDetails).toBe(false)
      await expectNoUnexpectedAccessibilityViolations(page)
    })

    for (const viewport of [{ width: 375, height: 667 }, { width: 1280, height: 480 }]) {
      test(`travel keyboard controls clear the header in a ${viewport.width} by ${viewport.height} viewport`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await openPage(page, '/travel/')
        await page.locator('[data-ui-world-map-select]').selectOption('MX')

        for (const control of ['[data-travel-close]', '[data-travel-previous]', '[data-travel-next]']) {
          const button = page.locator(control)

          await button.focus()
          await expect(button).toBeInViewport({ ratio: 1 })
          const visible = await button.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return element.contains(document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2
            ))
          })

          expect(visible).toBe(true)
        }
      })
    }
  })
}

test('organization selection keeps keyboard focus operable at either end', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await page.goto('/about/')
  const index = page.getByRole('navigation', { name: 'Choose an organization' })
  const first = index.getByRole('button', { name: '01 Void', exact: true })
  const last = index.getByRole('button', { name: '09 ReactJS Colombia', exact: true })

  await last.focus()
  await page.keyboard.press('Enter')
  await expect(last).toBeEnabled()
  await expect(last).toBeFocused()
  await expect(last).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-carousel-status]')).toHaveText('Showing 8–9 of 9')
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(first).toBeEnabled()
  await expect(first).toBeFocused()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-carousel-status]')).toHaveText('Showing 1–2 of 9')
  await index.getByRole('button', { name: '03 Datagran', exact: true }).press('Space')
  await expect(page.locator('[data-carousel-status]')).toHaveText('Showing 3–4 of 9')
})

test('organization selection follows available card width and preserves focused content', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await openPage(page, '/about/')
  const items = page.locator('[data-carousel-item]:visible')

  await expect(items).toHaveCount(1)
  await page.getByRole('button', { name: '02 Optic Power', exact: true }).click()
  const link = items.first().getByRole('link')
  const href = requireValue(await link.getAttribute('href'))

  await link.focus()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(items).toHaveCount(2)
  await expect(page.locator(`[data-carousel-item] a[href="${href}"]`)).toBeFocused()
  await expect(page.locator(`[data-carousel-item] a[href="${href}"]`)).toBeInViewport()
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '100%'
  })
  await expect(items).toHaveCount(3)
  await expect(page.locator(`[data-carousel-item] a[href="${href}"]`)).toBeFocused()
})

test('About carousel rebinds once after client navigation', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 })
  await openPage(page, '/about/', '100%')
  const initialDocument = await page.evaluateHandle(() => document)

  await page.locator('a[href="/"]').first().click()
  await expect(page).toHaveURL('/')
  await page.goBack()
  await expect(page).toHaveURL('/about/')
  expect(await initialDocument.evaluate(node => node === document)).toBe(true)
  await initialDocument.dispose()
  await page.getByRole('button', { name: '03 Datagran', exact: true }).click()
  await expect(page.locator('[data-carousel-status]')).toHaveText('Showing 3–4 of 9')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await expect(page.locator('[data-carousel-item]:visible')).toHaveCount(1)
  await expect(page.locator('[data-carousel-status]')).toHaveText('Showing 3 of 9')
})

test('enlarged Projects content stacks before its columns become cramped', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await openPage(page, '/projects/')
  const stacked = await page.evaluate(() => {
    const first = document.querySelector('.projects-editorial-card')
    const second = first?.nextElementSibling
    const third = second?.nextElementSibling
    const image = first?.querySelector('.projects-editorial-image')?.getBoundingClientRect()
    const copy = first?.querySelector('.projects-editorial-copy')?.getBoundingClientRect()
    const secondBox = second?.getBoundingClientRect()
    const thirdBox = third?.getBoundingClientRect()
    const paths = [...document.querySelectorAll('.projects-intro-paths a')]
      .map(element => element.getBoundingClientRect())

    return {
      cards: !!secondBox && !!thirdBox && secondBox.bottom <= thirdBox.top &&
        Math.abs(secondBox.left - thirdBox.left) < 1,
      featured: !!image && !!copy && image.bottom <= copy.top + 1,
      paths: paths.length === 3 && paths.every((item, index) => (
        index === 0 || (paths[index - 1]?.bottom ?? Infinity) <= item.top
      ))
    }
  })

  expect(stacked).toEqual({ cards: true, featured: true, paths: true })
})
