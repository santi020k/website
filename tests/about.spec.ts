import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { shouldRunVisualSnapshots } from './helpers/visual-regression'

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about/')
  })

  test('should have the correct title and main heading', async ({ page }) => {
    await expect(page).toHaveTitle('Santiago Molina — Engineering Leader | santi020k')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Calm systems. Clear delivery.')
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
    await expect(page.locator('.ui-note')).toHaveCount(3)
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

  test('should page the organization carousel reversibly without hiding focused links', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 800 })

    const carousel = page.locator('[data-organization-carousel]')
    const items = carousel.locator('[data-carousel-item]')
    const previousButton = carousel.getByRole('button', { name: 'Show previous organizations' })
    const nextButton = carousel.getByRole('button', { name: 'Show next organizations' })

    await expect(items).toHaveCount(9)

    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) await nextButton.click()

    await expect(items.nth(6)).toBeHidden()
    await expect(items.nth(7)).toBeVisible()
    await expect(items.nth(8)).toBeVisible()

    await previousButton.click()

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
    const nextButton = carousel.getByRole('button', { name: 'Show next organizations' })

    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) await nextButton.click()

    const focusedLink = carousel.locator('[data-carousel-item]').nth(7).locator('a')

    await focusedLink.focus()

    for (const { width, status } of [
      { width: 390, status: 'Showing 8 of 9' },
      { width: 1440, status: 'Showing 7–9 of 9' },
      { width: 800, status: 'Showing 7–8 of 9' }
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
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

        const portrait = page.getByRole('img', { name: 'Portrait of Santiago Molina (@santi020k)' })
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
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Calm systems. Clear delivery.')
      })
    }
  }

  if (shouldRunVisualSnapshots) {
    test('should match visual snapshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('about-page.png')
    })
  }
})
