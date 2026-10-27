import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const theme of ['light', 'dark']) {
  test(`footer distinguishes a parent section from the current page in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/blog/')
    const footer = page.locator('[data-site-footer]')
    const blog = footer.getByRole('link', { name: 'Blog', exact: true })
    const activeColor = await blog.evaluate(link => getComputedStyle(link).color)

    await page.goto('/blog/git-best-practices-for-calm-collaboration/')
    await expect(blog).toHaveAttribute('aria-current', 'true')
    await expect(blog).toHaveCSS('color', activeColor)
    await expect(blog).toHaveCSS('text-decoration-line', 'underline')
    await expect(footer.locator('[aria-current="page"]')).toHaveCount(0)
    await blog.click()
    await expect(page).toHaveURL('/blog/')
    await expect(blog).toHaveAttribute('aria-current', 'page')
    await expect(footer.locator('[aria-current="true"]')).toHaveCount(0)
  })
}

test('footer preserves contact destinations, profile identity, and keyboard navigation', async ({ page, browserName }) => {
  await page.goto('/')
  const footer = page.locator('[data-site-footer]')
  const contact = footer.locator('.maker-footer-action')
  await expect(footer.locator('.maker-footer-invitation')).toContainText(
    'Tell me about an engineering role, a product collaboration, or a speaking invitation.'
  )
  await expect(contact).toHaveAccessibleName('Let’s talk Start a conversation on WhatsApp')
  await expect(contact).toHaveAttribute('href', /^https:\/\/api\.whatsapp\.com\/send\?/)
  await expect(contact).toHaveAttribute('rel', /noopener/)
  await expect(footer.locator('a[href="mailto:hi@santi020k.com"]')).toBeVisible()
  await expect(footer.locator('a[href="https://santi020k.com"]')).toHaveAccessibleName('Santiago Molina — santi020k')
  await expect(footer.locator('a[href="https://github.com/santi020k"]')).toHaveAttribute('rel', /\bme\b/)
  const versionLink = footer.locator('.maker-footer-version')
  const visibleVersion = (await versionLink.innerText()).trim()

  expect(visibleVersion).toMatch(/^v\d+\.\d+\.\d+/u)
  await expect(versionLink).toHaveAccessibleName(`${visibleVersion} — Website source`)

  const reportIssue = footer.getByRole('link', { name: 'Report an issue', exact: true })
  await expect(reportIssue).toHaveAttribute('href', 'https://github.com/santi020k/website/issues/new/choose')
  await expect(reportIssue).toHaveAttribute('target', '_blank')
  await expect(reportIssue).toHaveAttribute('rel', 'noopener noreferrer')
  await reportIssue.focus()
  await expect(reportIssue).toBeFocused()

  await contact.focus()
  await expect(contact).toBeFocused()
  // Safari on macOS uses Option-Tab to include links in keyboard navigation.
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
  await expect(footer.locator('a[href="mailto:hi@santi020k.com"]')).toBeFocused()
  await footer.locator('a[href="/about/"]').click()
  await expect(page).toHaveURL(/\/about\/$/)
  await expect(footer.locator('a[aria-current="page"]')).toHaveText('About')
})

test('compact footer keeps the directory and legal links without a repeated contact pitch', async ({ page }) => {
  await page.goto('/privacy/')
  const footer = page.locator('[data-site-footer]')
  await expect(footer).toHaveAttribute('data-variant', 'compact')
  await expect(footer.locator('#footer-heading')).toHaveCount(0)
  await expect(footer.locator('a[href="/speaking/"]')).toBeVisible()
  await expect(footer.locator('a[href="/resume/"]')).toBeVisible()
  await expect(footer.locator('a[aria-current="page"]')).toHaveText('Privacy')
})

for (const theme of ['light', 'dark'] as const) {
  test(`Sculpted lift preserves the footer layout and supports keyboard and reduced motion in ${theme}`, async ({ page, browserName }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' })
    await page.goto('/speaking/')
    const invitation = page.locator('.maker-footer-invitation')
    const action = invitation.locator('.maker-footer-action')
    const sheet = invitation.locator('.maker-footer-action-sheet')
    const email = invitation.locator('.maker-footer-email')
    const arrow = action.locator('.maker-footer-action-arrow')

    await invitation.scrollIntoViewIfNeeded()
    const restingLayout = await sheet.boundingBox()
    const restingSurface = await action.evaluate(element => getComputedStyle(element).backgroundColor)
    await action.hover()
    await expect(action).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)')
    await expect(arrow.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
    await expect.poll(() => arrow.locator('[data-arrow-track]').evaluate(element => element.getAnimations()[0]?.playState)).toBe('finished')
    await expect(action).toHaveCSS('background-color', restingSurface)
    expect(await sheet.boundingBox()).toEqual(restingLayout)
    const originalEdgesRemainClickable = await action.evaluate(element => {
      const sheet = element.closest('.maker-footer-action-sheet')
      if (!sheet) throw new Error('Missing footer action sheet')
      const bounds = sheet.getBoundingClientRect()
      return [
        { x: bounds.right - 1, y: bounds.top + bounds.height / 2 },
        { x: bounds.left + bounds.width / 2, y: bounds.bottom - 1 }
      ].map(point => document.elementFromPoint(point.x, point.y)?.closest('a') === element)
    })
    expect(originalEdgesRemainClickable).toEqual([true, true])
    const arrowInset = await arrow.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const link = element.closest('a')?.getBoundingClientRect()

      return link ? link.right - bounds.right : 0
    })
    expect(arrowInset).toBeGreaterThanOrEqual(8)

    await invitation.getByRole('heading').hover()
    await expect(action).toHaveCSS('transform', 'none')
    await email.focus()
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    await expect(action).toBeFocused()
    await expect(action).toHaveCSS('outline-style', 'solid')
    await expect(action).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -3, -3)')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(email).toBeFocused()
    await expect(email).toHaveCSS('outline-style', 'solid')
    await expect.poll(() => email.evaluate(element => getComputedStyle(element, '::after').transform)).toBe('matrix(1, 0, 0, 1, 0, 0)')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    await expect(action).toBeFocused()
    await expect(action).toHaveCSS('transform', 'none')
    await expect(action).toHaveCSS('transition-property', 'none')
    await expect(action).not.toHaveCSS('box-shadow', 'none')
    await expect(arrow.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
    await expect(email).toBeFocused()
    await expect(email.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
    await expect.poll(() => email.evaluate(element => getComputedStyle(element, '::after').transitionProperty)).toBe('none')
  })
}

for (const theme of ['light', 'dark']) {
  test(`footer has readable, accessible layouts in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const footer = page.locator('[data-site-footer]')
      await footer.scrollIntoViewIfNeeded()
      for (const element of await footer.locator('a, h2').all()) {
        const bounds = await element.boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds?.x).toBeGreaterThanOrEqual(0)
        expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    }
  })
}

for (const theme of ['light', 'dark'] as const) {
  test(`footer stays readable with enlarged text in ${theme} mode`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })

    for (const path of ['/', '/blog/', '/speaking/', '/privacy/']) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await page.evaluate(async () => {
          document.documentElement.style.fontSize = '200%'
          await document.fonts.ready
        })

        const invitation = page.getByRole('region', { name: 'Let’s build something useful.' })

        await expect(invitation.getByRole('link')).toHaveCount(path === '/privacy/' ? 0 : 2)
        const clipped = await page.locator('[data-site-footer]').evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('p, h2, a')].flatMap(item => {
            const range = document.createRange()

            range.selectNodeContents(item)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1
            )) ?
              [item.textContent] :
              []
          })
        })

        expect(clipped, `${path} at ${width}px with enlarged text`).toEqual([])
        for (const link of await invitation.getByRole('link').all()) {
          await link.focus()
          await expect(link).toBeFocused()
          await expect(link).toHaveCSS('outline-style', 'solid')
        }
      }
    }
  })
}
