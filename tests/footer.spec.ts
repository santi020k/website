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
    'Invite me to give a talk, tell me about an engineering role, or let’s grow your team with better code quality and practical AI.'
  )
  await expect(contact).toHaveAccessibleName('Let’s talk Pick a topic and message me on WhatsApp')
  await expect(contact).toHaveAttribute('href', '/work-with-me/#start')
  await expect(footer.locator('a[href="mailto:hi@santi020k.com"]')).toBeVisible()
  await expect(footer.locator('a[href="https://calendar.app.google/pQyPiv1yMViZUEcj8"]')).toHaveAttribute('rel', /noopener/)
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
  await expect(footer.locator('a[href="https://calendar.app.google/pQyPiv1yMViZUEcj8"]')).toBeFocused()
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

test.describe('Footer pointer feedback', () => {
  test.use({ isMobile: false, hasTouch: false })

  for (const theme of ['light', 'dark'] as const) {
    test(`footer contact rows stay stationary and support keyboard and reduced motion in ${theme}`, async ({ page, browserName }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'no-preference' })
      await page.goto('/speaking/')
      const invitation = page.locator('.maker-footer-invitation')
      const action = invitation.locator('.maker-footer-action')
      const email = invitation.locator('.maker-footer-email').first()
      const icon = action.locator('.maker-footer-action-icon')
      const arrow = action.locator('.maker-footer-action-arrow')

      await invitation.scrollIntoViewIfNeeded()
      // Keyboard focus can scroll the viewport without moving the row's layout.
      const readActionLayout = () => action.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        return {
          x: bounds.left + window.scrollX,
          y: bounds.top + window.scrollY,
          width: bounds.width,
          height: bounds.height
        }
      })
      const restingLayout = await readActionLayout()
      const restingColor = await action.evaluate(element => getComputedStyle(element).color)
      const restingIcon = await icon.evaluate(element => getComputedStyle(element).backgroundColor)
      await action.hover()
      await expect(action).not.toHaveCSS('color', restingColor)
      await expect(icon).not.toHaveCSS('background-color', restingIcon)
      await expect(arrow.locator('[data-arrow-track]')).toHaveCSS('animation-duration', '0.48s')
      await expect.poll(() => arrow.locator('[data-arrow-track]').evaluate(element => element.getAnimations()[0]?.playState)).toBe('finished')
      expect(await readActionLayout()).toEqual(restingLayout)
      const edgesRemainClickable = await action.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        return [
          { x: bounds.right - 1, y: bounds.top + bounds.height / 2 },
          { x: bounds.left + bounds.width / 2, y: bounds.bottom - 1 }
        ].map(point => document.elementFromPoint(point.x, point.y)?.closest('a') === element)
      })
      expect(edgesRemainClickable).toEqual([true, true])

      await invitation.getByRole('heading').hover()
      await expect(action).toHaveCSS('color', restingColor)
      await email.focus()
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
      await expect(action).toBeFocused()
      await expect(action).toHaveCSS('outline-style', 'solid')
      await expect(action).not.toHaveCSS('color', restingColor)
      expect(await readActionLayout()).toEqual(restingLayout)
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(email).toBeFocused()
      await expect(email).toHaveCSS('outline-style', 'solid')
      await expect.poll(() => email.evaluate(element => getComputedStyle(element, '::after').transform)).toBe('matrix(1, 0, 0, 1, 0, 0)')

      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
      await expect(action).toBeFocused()
      await expect(action).toHaveCSS('outline-style', 'solid')
      expect(await readActionLayout()).toEqual(restingLayout)
      const duration = await action.evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration))
      expect(duration).toBeLessThanOrEqual(0.001)
      await expect(arrow.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      await expect(email).toBeFocused()
      await expect(email.locator('[data-arrow-track]')).toHaveCSS('animation-name', 'none')
    })
  }
})

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

        await expect(invitation.getByRole('link')).toHaveCount(path === '/privacy/' ? 0 : 3)
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

for (const locale of ['en', 'es'] as const) {
  test(`footer keeps whole headings and separated touch targets in ${locale}`, async ({ page }) => {
    await page.goto(locale === 'es' ? '/es/about/' : '/about/')
    const footer = page.locator('[data-site-footer]')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const width of [320, 390, 768, 1440]) {
      for (const textSize of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const brokenWords = await footer.locator('h2').evaluate(element => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
          const broken: string[] = []
          let node = walker.nextNode()
          while (node) {
            for (const match of (node.textContent ?? '').matchAll(/[\p{L}]+/gu)) {
              const range = document.createRange()
              range.setStart(node, match.index)
              range.setEnd(node, match.index + match[0].length)
              const lines = new Set([...range.getClientRects()]
                .filter(rect => rect.width > 0).map(rect => Math.round(rect.y)))
              if (lines.size > 1) broken.push(match[0])
            }
            node = walker.nextNode()
          }
          return broken
        })
        expect(brokenWords, `${locale}: ${width}px / ${textSize}%`).toEqual([])
        const overlaps = await footer.evaluate(element => {
          const links = [...element.querySelectorAll('a')]
          return links.flatMap((link, index) => {
            const box = link.getBoundingClientRect()
            return links.slice(index + 1).filter(other => {
              const next = other.getBoundingClientRect()
              return Math.min(box.right, next.right) - Math.max(box.left, next.left) > 1 &&
                Math.min(box.bottom, next.bottom) - Math.max(box.top, next.top) > 1
            }).map(other => `${link.textContent} / ${other.textContent}`)
          })
        })
        expect(overlaps).toEqual([])
        for (const link of await footer.locator('a').all()) {
          const bounds = await link.boundingBox()
          expect(bounds?.height).toBeGreaterThanOrEqual(44)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
  })
}

test.describe('Footer without JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  for (const prefix of ['', '/es']) {
    test(`contact rows open the localized intake from ${prefix || '/'} without JavaScript`, async ({ page }) => {
      await page.goto(`${prefix}/about/`)
      await page.locator('.maker-footer-action').click()
      await expect(page).toHaveURL(`${prefix}/work-with-me/#start`)
      await expect(page.locator('#start')).toBeVisible()
    })
  }
})
