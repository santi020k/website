import { expect, test } from '@playwright/test'

const nextTab = {
  chromium: 'Tab',
  firefox: 'Tab',
  webkit: process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'
} as const

for (const width of [320, 390]) {
  test(`v1 enlarged mobile menu keeps every link clear of the archive header at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/v1/portfolio/')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = `${Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 2}px`
    })
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
    const toggle = page.locator('#toggle-nav-menu-mobile')
    const drawer = page.locator('#drawer')
    const menuLinks = drawer.getByRole('link')
    const headerBounds = await page.locator('#main-header').evaluate(header => {
      const bounds = header.getBoundingClientRect()

      return { x: bounds.x, width: bounds.width }
    })

    expect(headerBounds.x).toBeCloseTo(0, 0)
    expect(headerBounds.width).toBeCloseTo(width, 0)
    await toggle.scrollIntoViewIfNeeded()
    await expect.poll(() => toggle.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)

      return bounds.width > 0 && bounds.height > 0 && element.contains(hit)
    })).toBe(true)
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(menuLinks).toHaveCount(3)
    await expect(drawer.getByRole('link', { name: 'Blog', exact: true })).toBeVisible()
    await expect.poll(() => menuLinks.evaluateAll(links => links.flatMap(link => {
      const bounds = link.getBoundingClientRect()
      const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)

      return link.contains(hit) ? [] : [link.textContent.trim()]
    }))).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const link of await menuLinks.all()) {
      await page.keyboard.press('Tab')
      await expect(link).toBeFocused()
    }
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await expect(drawer).toBeHidden()
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await expect.poll(() => page.locator('#main-header').evaluate(header => {
      const notice = document.querySelector('.website-archive-banner')

      if (!notice) throw new Error('Missing archive notice')

      return header.getBoundingClientRect().top - notice.getBoundingClientRect().bottom
    })).toBeGreaterThanOrEqual(-1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(menuLinks.first()).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/v1/')
  })
}

for (const era of ['v1', 'v2', 'v3', 'v4']) {
  test(`${era} top notice follows the skip link and offers current destinations`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/${era}/portfolio/`)
    const notice = page.getByRole('complementary', { name: 'Website archive' })
    const links = notice.getByRole('link')

    await expect(notice).toHaveCSS('position', 'static')
    await expect(links).toHaveText(['View current page', 'Current homepage', 'Website history'])
    await expect(links.nth(0)).toHaveAttribute('href', '/portfolio/')
    await expect(links.nth(1)).toHaveAttribute('href', '/')
    await expect(links.nth(2)).toHaveAttribute('href', '/history/')
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('data-astro-reload', '')
      const height = await link.evaluate(element => element.getBoundingClientRect().height)

      expect(height).toBeGreaterThanOrEqual(44)
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://santi020k.com/${era}/portfolio/`)
    await page.keyboard.press(nextTab[browserName])
    await expect(page.locator('a[href="#main"]').first()).toBeFocused()
    await page.keyboard.press(nextTab[browserName])
    await expect(links.first()).toBeFocused()
  })

  test(`${era} each notice exit loads the current site as a new document`, async ({ page }) => {
    for (const [label, destination] of [
      ['View current page', '/portfolio/'],
      ['Current homepage', '/'],
      ['Website history', '/history/']
    ] as const) {
      await test.step(label, async () => {
        await page.goto(`/${era}/portfolio/`)
        await page.evaluate(() => {
          Reflect.set(window, 'archiveExitDocument', true)
        })
        await page.getByRole('complementary', { name: 'Website archive' }).getByRole('link', { name: label, exact: true }).click()
        await expect(page).toHaveURL(destination)
        expect(await page.evaluate(() => 'archiveExitDocument' in window)).toBe(false)
        await expect(page.locator('.website-archive-banner')).toHaveCount(0)
        await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/u)
      })
    }
  })

  test(`${era} home and error notices avoid a misleading current-page destination`, async ({ page }) => {
    for (const path of ['/', '/404.html']) {
      await page.goto(`/${era}${path}`)
      const notice = page.getByRole('complementary', { name: 'Website archive' })

      await expect(notice.getByRole('link')).toHaveText(['Current homepage', 'Website history'])
      await expect(notice.getByRole('link', { name: 'Current homepage', exact: true })).toHaveAttribute('href', '/')
      await expect(notice.getByRole('link', { name: 'Website history', exact: true })).toHaveAttribute('href', '/history/')
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    }
  })
}
