import { expect, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const route = '/portfolio/smith-commerce/'

const waitForPageLoad = (page: Page, pathname: string) => page.evaluate(destination => new Promise<void>(resolve => {
  const loaded = () => {
    if (location.pathname !== destination) return
    document.removeEventListener('astro:page-load', loaded)
    resolve()
  }

  document.addEventListener('astro:page-load', loaded)
}), pathname)

for (const theme of ['light', 'dark']) {
  test(`desktop chapter groups follow reading and preserve manual choices in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto(`${route}#core-challenge`)
    const rail = page.locator('[data-project-chapters]')
    const marcone = rail.locator('details').nth(0)
    const webb = rail.locator('details').nth(1)

    await expect(rail.locator('a')).toHaveCount(14)
    await expect(marcone).toHaveAttribute('open', '')
    await expect(webb).not.toHaveAttribute('open')
    await page.locator('#inside-the-product').evaluate(element => {
      element.scrollIntoView()
    })
    await expect(rail.locator('a[href="#inside-the-product"]')).toHaveAttribute('aria-current', 'location')
    await expect(webb).toHaveAttribute('open', '')
    await expect(marcone).not.toHaveAttribute('open')

    await webb.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(webb).not.toHaveAttribute('open')
    await page.evaluate(() => {
      scrollBy(0, 1)
    })
    await expect(webb).not.toHaveAttribute('open')
    await page.locator('#the-purchasing-challenge').evaluate(element => {
      element.scrollIntoView()
    })
    await expect(rail.locator('a[href="#the-purchasing-challenge"]')).toHaveAttribute('aria-current', 'location')
    await expect(webb).toHaveAttribute('open', '')

    await marcone.locator('summary').click()
    await page.locator('#why-this-experience-matters').evaluate(element => {
      element.scrollIntoView()
    })
    await expect(rail.locator('a[href="#why-this-experience-matters"]')).toHaveAttribute('aria-current', 'location')
    await expect(marcone).toHaveAttribute('open', '')
    await expect(webb).toHaveAttribute('open', '')
    await expectNoUnexpectedAccessibilityViolations(page)
  })

  for (const textSize of [100, 200]) {
    test(`desktop chapters fit enlarged text and short rails at ${textSize}% in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: textSize === 200 ? 2560 : 1440, height: 700 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.addInitScript(size => {
        const apply = () => {
          const root = document.querySelector('html')

          if (!root) return false
          root.style.fontSize = `${size}%`
          return true
        }

        if (apply()) return
        const observer = new MutationObserver(() => {
          if (apply()) observer.disconnect()
        })

        observer.observe(document, { childList: true })
      }, textSize)
      await page.goto(`${route}#inside-the-product`)
      await page.evaluate(() => document.fonts.ready)
      const navigation = page.locator('[data-project-chapters]')

      await expect(navigation).toBeVisible()
      const summary = navigation.locator('summary').first()

      await summary.focus()
      await page.keyboard.press('Space')
      await expect(summary).toBeFocused()
      // Native scrolling rounds to device pixels; retain the entire summary and
      // its inset focus outline within one CSS pixel of the visible rail.
      await expect.poll(() => summary.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const rail = element.closest('aside')?.getBoundingClientRect()

        return rail !== undefined && bounds.top >= Math.max(0, rail.top) - 1 &&
          bounds.bottom <= Math.min(innerHeight, rail.bottom) + 1
      })).toBe(true)
      await expect(summary).not.toHaveCSS('outline-style', 'none')
      expect(await navigation.locator('a, summary').evaluateAll(elements => elements.some(element => element.scrollWidth > element.clientWidth + 1))).toBe(false)
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    })
  }
}

test('a single chapter begins expanded and its overview remains a native destination', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/portfolio/lumen-ui/')
  const chapter = page.locator('[data-project-chapters] details')

  await expect(chapter).toHaveCount(1)
  await expect(chapter).toHaveAttribute('open', '')
  await chapter.getByRole('link', { name: /^Chapter overview:/u }).click()
  await expect(page).toHaveURL(/#a-shared-language-for-web-and-native-interfaces$/u)
  await expect(chapter.getByRole('link', { name: /^Chapter overview:/u })).toHaveAttribute('aria-current', 'location')
})

test('desktop chapters and their section destinations work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const chapter = page.locator('[data-project-chapters] details').first()

    await chapter.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(chapter).toHaveAttribute('open', '')
    await chapter.getByRole('link', { name: 'Technical highlights', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#technical-highlights$/u)
    await expect(page.locator('#technical-highlights')).toBeInViewport()
  } finally {
    await context.close()
  }
})

test('chapter groups reinitialize after client navigation and fragment history', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${route}#inside-the-product`)
  const lifecycleToken = crypto.randomUUID()

  await page.evaluate(value => Object.defineProperty(window, 'chapterLifecycle', { value, configurable: true }), lifecycleToken)
  await Promise.all([
    waitForPageLoad(page, '/portfolio/void/'),
    page.getByRole('link', { name: 'Read case study: Void.GG', exact: true }).click()
  ])
  await expect(page).toHaveURL('/portfolio/void/')
  await Promise.all([waitForPageLoad(page, route), page.goBack()])
  await expect(page).toHaveURL(`${route}#inside-the-product`)
  expect(await page.evaluate(() => {
    const value: unknown = Reflect.get(window, 'chapterLifecycle')

    return typeof value === 'string' ? value : null
  })).toBe(lifecycleToken)
  const group = page.locator('[data-project-chapters] details').nth(1)

  // Back restores the position where the related card was opened. Follow native
  // links on the restored page so Astro records each entry's scroll position.
  await expect(page.locator('[data-project-chapters] a[href="#why-this-experience-matters"]'))
    .toHaveAttribute('aria-current', 'location')
  await page.locator('#inside-the-product').evaluate(element => {
    element.scrollIntoView()
  })
  await expect(group.locator('a[href="#inside-the-product"]')).toHaveAttribute('aria-current', 'location')
  await expect(group).toHaveAttribute('open', '')
  await group.getByRole('link', { name: 'The purchasing challenge', exact: true }).click()
  await expect(group.locator('a[href="#the-purchasing-challenge"]')).toHaveAttribute('aria-current', 'location')
  await expect(group).toHaveAttribute('open', '')
  await group.getByRole('link', { name: 'My approach', exact: true }).click()
  await expect(page).toHaveURL(/#my-approach$/u)
  await expect(group.locator('a[href="#my-approach"]')).toHaveAttribute('aria-current', 'location')
  await page.goBack()
  await expect(page).toHaveURL(/#the-purchasing-challenge$/u)
  await expect(group).toHaveAttribute('open', '')
  await expect(group.locator('a[href="#the-purchasing-challenge"]')).toHaveAttribute('aria-current', 'location')
})
