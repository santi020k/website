import { expect, type Locator, type Page, test } from '@playwright/test'

const enlargeText = async (page: Page, size = 200) => {
  await page.evaluate(async textSize => {
    document.documentElement.style.fontSize = `${textSize}%`
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  }, size)
}

const expectVisibleTextToFit = async (container: Locator) => {
  const clipped = await container.evaluate(element => {
    const bounds = element.getBoundingClientRect()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const failures: string[] = []
    let node = walker.nextNode()

    while (node) {
      const text = node.textContent?.trim()
      const parent = node.parentElement

      if (text && parent?.checkVisibility() && !parent.closest('.sr-only, .ui-sr-only')) {
        const range = document.createRange()

        range.selectNodeContents(node)
        if ([...range.getClientRects()].some(rect => rect.width > 0 && (
          rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
        ))) failures.push(text)
      }
      node = walker.nextNode()
    }

    return failures
  })

  expect(clipped).toEqual([])
}

for (const prefix of ['', '/es']) {
  const portfolioTotal = prefix ? /^\d+ casos de estudio seleccionados$/u : /^\d+ selected case studies$/u

  for (const theme of ['light', 'dark'] as const) {
    test.describe(`Reflow regressions ${prefix || 'English'} in ${theme}`, () => {
      test.use({ colorScheme: theme, reducedMotion: 'reduce' })

      for (const [width, textSize] of [[320, 200], [390, 100], [768, 200], [1440, 100]] as const) {
        for (const { route, selector, label } of [
          { route: '/', selector: '[data-community-intro]', label: 'community heading' },
          { route: '/portfolio/', selector: '#independent-builds [data-collection-masthead]', label: 'portfolio collection label' },
          { route: '/projects/', selector: '[data-technology-ledger="featured"]', label: 'technology names and counts' }
        ]) {
          test(`${label} stays complete at ${width}px and ${textSize}% text`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 })
            await page.goto(`${prefix}${route}`)
            await enlargeText(page, textSize)

            const content = page.locator(selector)

            await expect(content).toBeVisible()
            await expectVisibleTextToFit(content)
          })
        }
      }

      test('portfolio collection label uses the interface language at enlarged size', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 900 })
        await page.goto(`${prefix}/portfolio/`)
        await enlargeText(page)
        const masthead = page.locator('#independent-builds [data-collection-masthead]')

        await expect(masthead.locator('[data-collection-count]')).toHaveText(portfolioTotal)
        await expectVisibleTextToFit(masthead)
      })

      test('wrapped technology count retains its accessible link and keyboard focus', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 900 })
        await page.goto(`${prefix}/projects/`)
        await enlargeText(page)
        const technology = page.locator(`[data-technology-ledger="featured"] a[href="${prefix}/technologies/typescript/"]`)

        await expect(technology).toHaveAccessibleName(/TypeScript \d+ (projects|proyectos)/u)
        await technology.focus()
        await expect(technology).toBeInViewport({ ratio: 1 })
        await expect(technology).toHaveCSS('outline-style', 'solid')
        await expectVisibleTextToFit(technology)
      })

      test('every short landscape menu row stays fully visible during keyboard navigation', async ({ page, browserName }) => {
        await page.setViewportSize({ width: 667, height: 250 })
        await page.goto(`${prefix}/`)
        await enlargeText(page)
        const toggle = page.locator('[data-mobile-nav-toggle]')

        await toggle.click()
        const links = page.locator('[data-mobile-nav-link]')
        const count = await links.count()

        expect(count).toBeGreaterThan(0)
        for (let index = 0; index < count; index += 1) {
          const link = links.nth(index)

          await expect(link).toBeFocused()
          await expect(link).toBeInViewport({ ratio: 1 })
          await expectVisibleTextToFit(link)
          const height = await link.evaluate(element => element.getBoundingClientRect().height)

          expect(height).toBeGreaterThanOrEqual(44)
          await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
        }
        await page.keyboard.press('Escape')
        await expect(toggle).toBeFocused()
        await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      })
    })
  }
}
