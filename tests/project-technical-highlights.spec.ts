import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const route = '/portfolio/smith-commerce/'
const chapters = [
  { client: 'Marcone', id: 'technical-highlights', count: 20 },
  { client: 'F.W. Webb', id: 'webb-technical-highlights', count: 15 }
]

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 1440]) {
    test(`connected folios reflow with usable links at ${width}px in ${theme}`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      for (const chapter of chapters) {
        const folio = page.locator(`[data-technical-highlights="${chapter.client}"]`)
        const links = folio.locator('[data-technical-link]')

        await expect(links).toHaveCount(chapter.count)
        await expect(folio.locator('h4')).toHaveCount(3)
        await expect(folio.locator('h3')).toHaveAttribute('id', chapter.id)
        await expect(links.filter({ has: page.locator('[data-technical-name]', { hasText: /^React$/u }) })).toHaveAttribute('href', '/technologies/react-js/')
        await expect(folio.getByRole('link', { name: 'All technologies' })).toHaveAttribute('href', '/technologies/')
        for (const textSize of [100, 200]) {
          await page.evaluate(size => {
            document.documentElement.style.fontSize = `${size}%`
          }, textSize)
          await folio.scrollIntoViewIfNeeded()
          expect(await folio.locator('a, h3, h4, p').evaluateAll(elements => elements.some(element => element.scrollWidth > element.clientWidth + 1))).toBe(false)
          const heights = await links.evaluateAll(els => els.map(el => el.getBoundingClientRect().height))

          expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
        }
        await page.evaluate(() => {
          document.documentElement.style.fontSize = ''
        })
        await links.first().focus()
        await expect(links.first()).toBeFocused()
        await expect(links.first()).toHaveCSS('outline-style', 'solid')
        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
        await expect(links.nth(1)).toBeFocused()
      }
      const results = await new AxeBuilder({ page }).include('[data-technical-highlights]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

      expect(results.violations).toEqual([])
    })
  }
}

test('technology connections match real destination counts and preserve chapter navigation', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(route)
  const connections = await page.locator('[data-technical-link]').evaluateAll(elements => elements.map(element => ({
    href: element.getAttribute('href'),
    count: Number.parseInt(element.querySelector('[data-technical-count]')?.textContent ?? '', 10)
  })))
  const uniqueConnections = new Map(connections.map(connection => [connection.href, connection]))

  for (const connection of uniqueConnections.values()) {
    const response = await request.get(connection.href ?? '')

    expect(response.ok()).toBe(true)
    const schemaCount = /"numberOfItems"\s*:\s*(\d+)/u.exec(await response.text())?.[1]

    expect(connection.count).toBe(Number(schemaCount))
  }
  for (const chapter of chapters) {
    await page.goto(`${route}#${chapter.id}`)
    await expect(page.locator(`[data-project-desktop-toc] [data-reading-contents] a[href="#${chapter.id}"]`)).toHaveAttribute('aria-current', 'location')
    await expect(page.locator(`#${chapter.id}`)).toBeInViewport()
  }
  await expect(page.locator('[data-project-desktop-toc] [data-reading-contents] a[href*="-group-"]')).toHaveCount(0)
})

test('technology connections work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 390, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(`${route}#technical-highlights`)
    await page.evaluate(() => document.fonts.ready)
    const react = page.locator('[data-technical-highlights="Marcone"] a[href="/technologies/react-js/"]')

    await expect(react).not.toHaveAttribute('target', '_blank')
    await react.click()
    await expect(page).toHaveURL(/\/technologies\/react-js\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('React.js')
  } finally {
    await context.close()
  }
})
