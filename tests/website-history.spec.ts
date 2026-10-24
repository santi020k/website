import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark']) {
  test(`history works on desktop and mobile in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/history/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A website,over time.')
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://santi020k.com/history/')
    await expect(page.locator('.history-era')).toHaveCount(4)
    await expect(page.locator('.history-hero-print img')).toHaveCount(3)
    await page.locator('.history-hero-print img').evaluateAll(async images => {
      await Promise.all(images.map(image => image instanceof HTMLImageElement ? image.decode() : Promise.reject(new Error('Expected an image'))))
    })
    const chapters = page.getByRole('navigation', { name: 'Jump to a design era' })
    await expect(chapters.getByRole('link')).toHaveCount(4)
    for (const id of ['v1', 'v2', 'v3', 'v4']) {
      await expect(chapters.locator(`a[href="#${id}"]`)).toHaveCount(1)
    }
    for (const width of [320, 375, 390, 639, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(async () => {
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
          resolve()
        })))
      })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const navbar = await page.locator('[data-header-frame]').evaluate(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      })
      const hero = await page.locator('.history-intro').evaluate(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y, width, height }
      })
      expect(hero.x).toBeCloseTo(navbar.x, 1)
      expect(hero.width).toBeCloseTo(navbar.width, 1)
      expect(hero.y).toBeCloseTo(navbar.y + navbar.height, 1)
      const heroSurface = await page.locator('.history-intro').evaluate(element => getComputedStyle(element).backgroundColor)
      const brandSurface = await page.locator('.site-header-brand').evaluate(element => getComputedStyle(element).backgroundColor)
      expect(heroSurface).toBe(brandSurface)

      await expectNoUnexpectedAccessibilityViolations(page)
    }
    const secondChapter = chapters.locator('a[href="#v2"]')
    await secondChapter.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/history\/#v2$/)
    await expect(page.locator('#v2')).toBeInViewport()
    const openArchive = page.getByRole('link', { name: 'Open V1', exact: true })
    await openArchive.focus()
    await expect(openArchive).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/v1\/$/)
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
    await page.getByRole('link', { name: 'Website history', exact: true }).click()
    await expect(page).toHaveURL(/\/history\/$/)
  })
}

test.describe('History chapters without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } })

  for (const theme of ['light', 'dark'] as const) {
    test(`complete words and archive links survive enlarged text in ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto('/history/')
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await page.evaluate(() => document.fonts.ready)
      const broken = await page.locator('.history-hero-chapters, .history-era-heading, .history-captures figcaption').evaluateAll(elements => {
        const failures: string[] = []
        for (const element of elements) {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          let node = walker.nextNode()
          while (node) {
            for (const match of (node.textContent ?? '').matchAll(/[A-Za-z0-9]+/gu)) {
              const range = document.createRange()
              range.setStart(node, match.index)
              range.setEnd(node, match.index + match[0].length)
              const boxes = [...range.getClientRects()].filter(rect => rect.width > 0)
              const wraps = new Set(boxes.map(rect => Math.round(rect.y))).size > 1
              const overflows = boxes.some(rect => rect.left < 0 || rect.right > innerWidth)
              if (wraps || overflows) failures.push(match[0])
            }
            node = walker.nextNode()
          }
        }
        return failures
      })
      expect(broken, 'Chapter shortcuts, copy and capture captions keep complete words').toEqual([])
      await expect(page.locator('.history-era').getByRole('heading', { level: 2 })).toHaveCount(4)
      const archive = page.getByRole('link', { name: 'Open V3', exact: true })
      await archive.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/v3\/$/)
      await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
    })
  }
})

for (const id of ['v1', 'v2', 'v3']) {
  test(`${id} keeps navigation, assets, storage and robots scoped`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto(`/${id}/`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('a[href="/blog/"]')).toHaveCount(0)
    await expect(page.locator('a[href="/history/"]')).toHaveAttribute('data-astro-reload', '')
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0)
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(async image => {
        image.loading = 'eager'
        await image.decode()
      }))
    })
    expect(await page.locator('img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.naturalWidth > 0))).toBe(true)
    await page.locator(`a[href="/${id}/portfolio/"]:visible`).first().click()
    await expect(page).toHaveURL(new RegExp(`/${id}/portfolio/$`))
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
    await page.getByRole('link', { name: 'View current page', exact: true }).click()
    await expect(page).toHaveURL(/\/portfolio\/$/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
}

test('archive newsletter cannot submit', async ({ page }) => {
  await page.goto('/v3/newsletter/')
  for (const form of await page.locator('form').all()) {
    await expect(form).toHaveAttribute('inert', '')
    await expect(form).not.toHaveAttribute('action', /https?:/)
  }
})

for (const id of ['v2', 'v3']) {
  test(`${id} search results open within the archive`, async ({ page }) => {
    await page.goto(`/${id}/`)
    await page.locator('[data-site-search-trigger]').click()
    await page.locator('#site-search-input').fill('astro')
    const result = page.locator('#site-search-results a').first()
    await expect(result).toHaveAttribute('href', new RegExp(`^/${id}/`))
    await result.click()
    await expect(page).toHaveURL(new RegExp(`/${id}/`))
    await expect(page.getByRole('complementary', { name: 'Website archive' })).toBeVisible()
  })
}

test('v1 portfolio tabs support keyboard selection', async ({ page }) => {
  await page.goto('/v1/portfolio/')
  const tabs = page.getByRole('tab')
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toBeFocused()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel')).toHaveCount(1)
  await page.keyboard.press('Home')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
})

for (const id of ['v1', 'v2', 'v3']) {
  test(`${id} supports mobile dark navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await page.goto(`/${id}/`)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const toggle = page.locator(id === 'v1' ? '#toggle-nav-menu-mobile' : '[data-mobile-nav-toggle]')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('link', { name: 'Website history', exact: true })).toBeVisible()
  })
}

// Error and offline documents have no current counterpart; their notice leads home.
for (const path of ['/v1/404.html', '/v2/404.html', '/v3/404.html', '/v2/offline/', '/v3/offline/']) {
  test(`${path} archive notice leads to the current homepage`, async ({ page }) => {
    await page.goto(path)
    const notice = page.getByRole('complementary', { name: 'Website archive' })
    const home = notice.getByRole('link', { name: 'Visit current website', exact: true })
    await expect(home).toHaveAttribute('href', '/')
    await expect(home).toHaveAttribute('data-astro-reload', '')
    await expect(notice.getByRole('link', { name: 'View current page', exact: true })).toHaveCount(0)
  })
}
