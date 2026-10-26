import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const openWithTextSize = async (page: Page, route: string, fontSize = '200%') => {
  await page.addInitScript(size => {
    const apply = () => {
      const root = document.querySelector('html')

      if (!root) return false
      root.style.fontSize = size
      return true
    }
    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect()
      })
      observer.observe(document, { childList: true })
    }
  }, fontSize)
  await page.goto(route)
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  })
}

// Both Tailwind and Lumen provide screen-reader-only labels; they are not visible copy.
// Topic rows and article tables scroll intentionally and have separate keyboard coverage.
const expectVisibleCopyOnScreen = async (root: Locator) => {
  const clipped = await root.evaluate(element => {
    const failures: string[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const parent = node.parentElement
      const text = node.textContent?.trim()
      const scrollRegion = parent?.closest('[data-blog-tag-filter], [data-prose-table]')
      const inScrollingRegion = scrollRegion && ['auto', 'scroll'].includes(getComputedStyle(scrollRegion).overflowX)
      if (text && !inScrollingRegion && parent?.checkVisibility() && !parent.closest('.sr-only, .ui-sr-only, script, style, [hidden]')) {
        const range = document.createRange()
        range.selectNodeContents(node)
        const clippingBounds: { left: number, right: number }[] = [{ left: 0, right: innerWidth }]
        let ancestor: Element | null = parent

        while (ancestor) {
          const style = getComputedStyle(ancestor)

          if (['hidden', 'clip'].includes(style.overflowX)) {
            const bounds = ancestor.getBoundingClientRect()
            const left = bounds.left + ancestor.clientLeft
            // Use both rendered edges: clientWidth omits the rotation of
            // History's archive prints and would falsely report clipped copy.
            const right = bounds.right - Number.parseFloat(style.borderRightWidth)

            clippingBounds.push({ left, right })
          }
          ancestor = ancestor.parentElement
        }
        const outside = [...range.getClientRects()].some(rect => (
          rect.width > 0 && clippingBounds.some(bounds => rect.left < bounds.left - 1 || rect.right > bounds.right + 1)
        ))

        if (outside) {
          failures.push(text.slice(0, 100))
        }
      }
      node = walker.nextNode()
    }
    return [...new Set(failures)]
  })
  expect(clipped).toEqual([])
}

const routes = [
  '/blog/',
  '/blog/why-developer-experience-work-should-be-measured-like-product-work/',
  '/work/',
  '/speaking/',
  '/technologies/',
  '/technologies/typescript/',
  '/developer-experience/',
  '/resume/',
  '/history/',
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/404/',
  '/offline/',
  '/blog/tags/',
  '/blog/tags/typescript/',
  '/blog/series/',
  '/blog/series/building-a-production-nextjs-app/'
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Remaining pages in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })
    for (const route of routes) {
      for (const width of [320, 375, 768, 1024, 1440]) {
        test(`${route} retains visible copy at ${width}px with enlarged text`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await openWithTextSize(page, route)
          await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
          await expectVisibleCopyOnScreen(page.locator('main'))
        })
      }
    }

    test('technology search remains visible and usable with keyboard at tablet width', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 1024, height: 900 })
      await openWithTextSize(page, '/technologies/')
      const search = page.getByRole('searchbox', { name: 'Find a technology' })
      await search.focus()
      await expect(search).toBeInViewport({ ratio: 1 })
      await search.fill('not-a-real-tool')
      await expect(page.locator('[data-technologies-empty]')).toBeVisible()
      await expect(page.locator('#technology-filter-status')).toHaveText('0 technologies found.')
      await search.fill('typescript')
      await expect(page.locator('[data-technologies-empty]')).toBeHidden()
      await expect(page.locator('[data-technology-item]:visible')).toHaveCount(1)
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(page.locator('[data-technology-opening-actions]').getByRole('link', { name: 'Browse work' })).toBeFocused()
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(page.locator('[data-technology-opening-actions]').getByRole('link', { name: 'Portfolio', exact: true })).toBeFocused()
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(page.locator('[data-technology-matches-list]').getByRole('link')).toBeFocused()
      await expectVisibleCopyOnScreen(page.locator('main'))
      await expectNoUnexpectedAccessibilityViolations(page)
    })

    test('topic sort controls fit a narrow viewport and retain focus after sorting', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 900 })
      await openWithTextSize(page, '/blog/tags/')
      const alphabetical = page.getByRole('button', { name: 'A → Z' })
      await alphabetical.focus()
      await expect(alphabetical).toBeInViewport({ ratio: 1 })
      await page.keyboard.press('Space')
      await expect(alphabetical).toHaveAttribute('aria-pressed', 'true')
      await expect(alphabetical).toBeFocused()
      await page.getByRole('searchbox', { name: 'Find a topic' }).fill('typescript')
      await expect(page.locator('#tag-filter-status')).toContainText('1 topic')
      await expectVisibleCopyOnScreen(page.locator('main'))
    })

    for (const route of ['/work/', '/speaking/', '/resume/', '/developer-experience/']) {
      test(`${route} passes accessibility checks at enlarged text`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 900 })
        await openWithTextSize(page, route)
        await expect(page.locator('html')).toHaveCSS('font-size', '32px')
        await expectNoUnexpectedAccessibilityViolations(page)
      })
    }
  })
}

for (const width of [768, 1024, 1440]) {
  test(`Speaking keeps its hero and timeline text columns usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWithTextSize(page, '/speaking/')
    const brokenWords = await page.locator('h1, [data-speaking-row] h3').evaluateAll(headings => headings.flatMap(heading => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
      const broken: string[] = []
      let node = walker.nextNode()
      while (node) {
        for (const match of (node.textContent ?? '').matchAll(/(?<!\S)[a-z]+(?=[.!?]?(?:\s|$))/giu)) {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + match[0].length)
          if (range.getClientRects().length > 1) broken.push(match[0])
        }
        node = walker.nextNode()
      }
      return broken
    }))
    expect(brokenWords).toEqual([])
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`career links have a visible inset keyboard outline in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/work/')
    const career = page.locator('[data-career-link]').first()
    await page.keyboard.press('Tab')
    await career.focus()
    await expect(career).toBeFocused()
    await expect(career).toHaveCSS('outline-offset', '-4px')
    const outline = await career.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        offset: Number.parseFloat(style.outlineOffset)
      }
    })
    expect(outline.style).toBe('solid')
    expect(outline.width).toBeGreaterThanOrEqual(2)
    expect(outline.offset).toBeLessThanOrEqual(-2)
  })
}

for (const size of ['100%', '200%']) {
  test(`field guides land below the header without doubling its offset at ${size} text`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWithTextSize(page, '/developer-experience/', size)
    await page.locator('a[href="#field-guides"]').click()
    await expect(page).toHaveURL(/#field-guides$/u)
    await expect.poll(async () => page.locator('#field-guides').evaluate(element => (
      Math.abs(element.getBoundingClientRect().top -
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))
    ))).toBeLessThanOrEqual(1)
    await expect(page.getByRole('heading', { name: 'Evidence, decisions, and implementation details.' })).toBeInViewport()
  })
}

test('resume downloads expose their visible labels to voice and keyboard navigation', async ({ page, browserName }) => {
  await page.goto('/resume/')
  const compact = page.getByRole('link', { name: 'Download 2-page resume PDF', exact: true })
  const full = page.getByRole('link', { name: 'Download full CV PDF', exact: true })
  await expect(compact).toContainText('2-page resume')
  await expect(compact).toHaveAttribute('href', '/pdf/cv.pdf')
  await expect(full).toContainText('Full CV')
  await expect(full).toHaveAttribute('href', '/pdf/cv-full.pdf')
  await compact.focus()
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  await expect(full).toBeFocused()
})

test('Work statistics reflow when text grows after the page loads', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/work/')
  await page.evaluate(() => document.fonts.ready)
  const stats = page.locator('.work-stats [data-slot="stat"]')
  const rowCount = () => stats.evaluateAll(elements => new Set(
    elements.map(element => Math.round(element.getBoundingClientRect().top))
  ).size)
  await expect(stats).toHaveCount(4)
  await expect.poll(rowCount).toBe(2)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await expect.poll(rowCount).toBe(4)
  await expectVisibleCopyOnScreen(page.locator('.work-stats'))
})

for (const width of [320, 375]) {
  test(`Work keeps short hero and company words whole at ${width}px with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWithTextSize(page, '/work/')
    const broken = await page.locator('.work-heading, [data-career-title]').evaluateAll(headings => {
      const words = ['Products', 'shipped', 'Teams', 'Smith', 'Commerce']
      return headings.flatMap(heading => {
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
        const failures: string[] = []
        let node = walker.nextNode()
        while (node) {
          for (const word of words) {
            const index = node.textContent?.indexOf(word) ?? -1
            if (index < 0) continue
            const range = document.createRange()
            range.setStart(node, index)
            range.setEnd(node, index + word.length)
            if (range.getClientRects().length > 1) failures.push(word)
          }
          node = walker.nextNode()
        }
        return failures
      })
    })
    expect(broken).toEqual([])
  })
}

for (const width of [768, 1440]) {
  for (const route of ['/privacy/', '/terms/', '/accessibility/']) {
    test(`${route} retains its normal-size policy columns at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await openWithTextSize(page, route, '100%')
      const row = page.locator('[data-policy-row]').first()
      const positions = await row.evaluate(element => {
        const heading = element.querySelector('h2')?.getBoundingClientRect()
        const copy = element.querySelector('p')?.getBoundingClientRect()
        return { headingRight: heading?.right, copyLeft: copy?.left }
      })
      expect(positions.headingRight).toBeDefined()
      expect(positions.copyLeft).toBeGreaterThan(positions.headingRight ?? Infinity)
      await expectVisibleCopyOnScreen(page.locator('main'))
    })
  }
}

for (const width of [1024, 1440]) {
  test(`Speaking retains its normal desktop hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openWithTextSize(page, '/speaking/', '100%')
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
    const profile = await page.getByRole('complementary', { name: 'Speaker profile' }).boundingBox()
    expect(heading).not.toBeNull()
    expect(profile?.x).toBeGreaterThan((heading?.x ?? Infinity) + (heading?.width ?? Infinity))
    await expectVisibleCopyOnScreen(page.locator('main'))
  })
}
