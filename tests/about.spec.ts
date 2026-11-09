import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle('Santiago Molina — Engineering Leader | santi020k')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Engineer. Maker. Always curious.')
  })

  test('should identify Santiago Molina as the profile page main entity', async ({ page }) => {
    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents()
    const profileSchema = structuredData.find(schema => schema.includes('"@type":"ProfilePage"'))

    expect(profileSchema).toBeDefined()
    expect(profileSchema).toContain('"name":"Santiago Molina"')
    expect(profileSchema).toContain('"alternateName":"santi020k"')
    expect(profileSchema).toContain('"sameAs"')
  })

  test('should contain key sections', async ({ page }) => {
    await expect(page.locator('#main').getByText('Engineering leader · full-stack architect', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What I believe about engineering/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /What collaborators say about the work/i })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Profile highlights' }).getByRole('article')).toHaveCount(3)
    await expect(page.locator('[data-principle]')).toHaveCount(6)
  })

  test('should have working call-to-action links', async ({ page }) => {
    const portfolioLink = page.getByRole('link', { name: /See selected work/i })
    const blogLink = page.getByRole('link', { name: /Read the blog/i })

    await expect(portfolioLink).toBeVisible()
    await expect(portfolioLink).toHaveAttribute('href', /^\/portfolio\/$/)

    await expect(blogLink).toBeVisible()
    await expect(blogLink).toHaveAttribute('href', /^\/blog\/$/)
  })

  test('chapter guide reaches each section using the keyboard', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    const guide = page.getByRole('navigation', { name: 'Explore this profile' })
    await expect(guide.getByRole('link')).toHaveCount(5)

    for (const name of ['Collaboration', 'Context', 'Principles', 'Outside work', 'Recommendations']) {
      const link = guide.getByRole('link', { name, exact: true })
      await expect(link).not.toHaveAttribute('target', '_blank')
      const destination = await link.evaluate((anchor: HTMLAnchorElement) => anchor.hash)
      expect(destination).toMatch(/^#about-/)

      await link.focus()
      await expect(link).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`/about/${destination}`)
      await expect(page.locator(destination).getByRole('heading', { level: 2 })).toBeInViewport()
    }
  })

  test('principle captions lead to published writing', async ({ page, request }) => {
    const links = page.locator('#about-principles [data-principle-source]').getByRole('link')

    await expect(links).toHaveCount(6)
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('href', /^\/blog\/.+\/$/)

      const href = await link.evaluate((anchor: HTMLAnchorElement) => anchor.pathname)

      expect((await request.get(href)).status()).toBe(200)
      await expect(link).not.toHaveAttribute('target', '_blank')
    }
    const firstLink = links.first()
    const destination = await firstLink.evaluate((anchor: HTMLAnchorElement) => anchor.pathname)

    await firstLink.focus()
    await expect(firstLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(destination)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('should select organizations by name without hiding focused links', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 800 })

    const carousel = page.locator('[data-organization-carousel]')
    const items = carousel.locator('[data-carousel-item]')
    await expect(items).toHaveCount(9)
    await items.first().getByRole('link').focus()
    await carousel.getByRole('button', { name: '09 ReactJS Colombia', exact: true }).click()

    await expect(items.nth(6)).toBeHidden()
    await expect(items.nth(7)).toBeVisible()
    await expect(items.nth(8)).toBeVisible()

    await carousel.getByRole('button', { name: '07 Justbit', exact: true }).click()

    await expect(items.nth(6)).toBeVisible()
    await expect(items.nth(7)).toBeVisible()
    await expect(items.nth(8)).toBeHidden()

    const focusedLink = items.nth(6).getByRole('link')

    await focusedLink.focus()
    await page.keyboard.press('ArrowRight')

    await expect(focusedLink).toBeFocused()
    await expect(items.nth(6)).toBeVisible()
    await expect(items.nth(8)).toBeHidden()
  })

  test('keeps the focused organization visible when responsive page sizes change', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 800 })

    const carousel = page.locator('[data-organization-carousel]')
    await carousel.getByRole('button', { name: '08 Nebular Technologies', exact: true }).click()

    const focusedLink = carousel.locator('[data-carousel-item]').nth(7).locator('a')

    await focusedLink.focus()

    for (const { width, status } of [
      { width: 390, status: 'Showing 8 of 9' },
      { width: 1440, status: 'Showing 7–9 of 9' },
      { width: 800, status: 'Showing 8–9 of 9' }
    ]) {
      await page.setViewportSize({ height: 900, width })
      await expect(carousel.locator('[data-carousel-status]')).toHaveText(status)
      await expect(focusedLink).toBeVisible()
      await expect(focusedLink).toBeFocused()
      await expect(focusedLink).toBeInViewport()
    }
  })

  test('should dispose carousel resize work across page transitions', async ({ page }) => {
    const detachedStatus = await page.locator('[data-carousel-status]').evaluateHandle(status => status)

    await page.locator('a[href="/"]').first().click()
    await expect(page).toHaveURL('/')

    await detachedStatus.evaluate(status => {
      status.textContent = 'detached-sentinel'
    })

    await page.setViewportSize({ height: 900, width: 800 })

    expect(await detachedStatus.evaluate(status => status.textContent)).toBe('detached-sentinel')
  })

  test('should pass accessibility audit', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`keeps the profile usable at ${width}px in ${theme} mode`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(selectedTheme => {
          localStorage.setItem('theme', selectedTheme)
        }, theme)
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('data-theme', `santi020k-${theme}`)

        const portrait = page.getByRole('img', { name: 'Santiago Molina outdoors with his brown-and-white dog.' })
        await expect(portrait).toBeVisible()
        const portraitLoaded = await portrait.evaluate(image => {
          if (!(image instanceof HTMLImageElement)) return false

          return image.complete && image.naturalWidth > 0
        })
        expect(portraitLoaded).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await expect(page.locator('[data-testimonial]')).toHaveCount(4)
        await expectNoUnexpectedAccessibilityViolations(page)

        const resumeLink = page.getByRole('main').getByRole('link', { name: 'View resume', exact: true })
        await resumeLink.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL('/resume/')
        await page.goBack()
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Engineer. Maker. Always curious.')
      })
    }
  }

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('about-page.png')
    })
  }
})
