import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const languageLayouts = [320, 768, 1440].flatMap(width => ['16px', '32px'].map(fontSize => {
  const isMenu = width === 320 || (width === 768 && fontSize === '32px')

  return {
    width,
    fontSize,
    variant: isMenu ? 'menu' : 'header',
    open: isMenu ? async (page: Page) => page.locator('[data-mobile-nav-toggle]').click() : async (page: Page) => page.locator('[data-language-switch="header"]').waitFor({ state: 'visible' })
  }
}))

for (const locale of [
  { name: 'en', path: '/about/', destination: '/es/about/', target: 'es', code: 'ES', label: 'Site interface in Spanish' },
  { name: 'es', path: '/es/about/', destination: '/about/', target: 'en', code: 'EN', label: 'Interfaz en inglés' }
]) {
  for (const theme of ['light', 'dark']) {
    for (const layout of languageLayouts) {
      const text = layout.variant === 'header' ? locale.code : locale.label
      const name = layout.variant === 'header' ? `${locale.code}: ${locale.label}` : locale.label

      test(`language control stays usable in ${locale.name}, ${theme}, ${layout.width}px with ${layout.fontSize} text`, async ({ page }) => {
        await page.setViewportSize({ width: layout.width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto(locale.path)
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, layout.fontSize)
        await layout.open(page)
        const link = page.locator(`[data-language-switch="${layout.variant}"]`)

        await expect(link).toBeVisible()
        await expect(link).toHaveAttribute('href', locale.destination)
        await expect(link).toHaveAttribute('hreflang', locale.target)
        await expect(link).toHaveAccessibleName(name)
        await expect(link).toHaveText(text)
        // Establish keyboard modality before inspecting the focus-visible outline.
        await page.keyboard.press('Tab')
        await link.focus()
        await expect(link).toBeFocused()
        await expect(link).toHaveCSS('outline-style', 'solid')
        const bounds = requireValue(await link.boundingBox())

        expect(bounds.width).toBeGreaterThanOrEqual(44)
        expect(bounds.height).toBeGreaterThanOrEqual(44)
        expect(bounds.x).toBeGreaterThanOrEqual(0)
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(layout.width)
        expect(await link.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
        const audit = await new AxeBuilder({ page }).include('header').analyze()

        expect(audit.violations).toEqual([])
      })
    }
  }
}

for (const width of [320, 375, 390, 768, 1024, 1088, 1200, 1280, 1440]) {
  for (const fontSize of ['16px', '20px', '32px']) {
    test(`header controls fit at ${width}px with ${fontSize} text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.evaluate(size => {
        document.documentElement.style.fontSize = size
      }, fontSize)
      await expect(page.locator('html')).toHaveCSS('font-size', fontSize)
      // Rem-based theme values settle on the next paint after text resizing.
      await page.evaluate(async () => {
        await document.fonts.ready
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve()
            })
          })
        })
      })

      const geometry = await page.locator('[data-header-shell]').evaluate(shell => {
        const bounds = shell.getBoundingClientRect()
        const controls = [...shell.querySelectorAll('a, button')]
          .filter(element => element.getClientRects().length > 0)
          .map(element => {
            const rect = element.getBoundingClientRect()

            return { left: rect.left, right: rect.right, height: rect.height, width: rect.width }
          })

        const hero = document.querySelector('[data-home-hero]')?.getBoundingClientRect()

        if (!hero) throw new Error('Home hero has no rendered bounds')

        return {
          left: bounds.left,
          right: bounds.right,
          bottom: bounds.bottom,
          heroTop: hero.top,
          heroLeft: hero.left,
          heroRight: hero.right,
          controls
        }
      })

      expect(Math.abs(geometry.left - geometry.heroLeft)).toBeLessThanOrEqual(1)
      expect(Math.abs(geometry.right - geometry.heroRight)).toBeLessThanOrEqual(1)
      expect(Math.abs(geometry.bottom - geometry.heroTop)).toBeLessThanOrEqual(1)

      for (const control of geometry.controls) {
        expect(control.left).toBeGreaterThanOrEqual(geometry.left)
        expect(control.right).toBeLessThanOrEqual(geometry.right)
        expect(control.height).toBeGreaterThanOrEqual(44)
        expect(control.width).toBeGreaterThanOrEqual(44)
      }

      for (const [index, control] of geometry.controls.slice(1).entries()) {
        expect(control.left).toBeGreaterThanOrEqual(requireValue(geometry.controls[index]).right)
      }
    })
  }
}

for (const theme of ['light', 'dark']) {
  test(`desktop navigation is accessible and marks the current route in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(selectedTheme => {
      localStorage.setItem('theme', selectedTheme)
    }, theme)
    await page.goto('/about/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const navigation = page.locator('.site-desktop-nav')

    await expect(navigation.locator('a[href="/about/"]')).toHaveAttribute('aria-current', 'page')
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)

    const results = await new AxeBuilder({ page }).include('header').analyze()

    expect(results.violations).toEqual([])
  })
}

type SectionState = 'page' | 'true' | null

const blogSectionRoutes: { path: string, blog: SectionState }[] = [
  { path: '/blog/', blog: 'page' },
  { path: '/blog/git-best-practices-for-calm-collaboration/', blog: 'true' },
  { path: '/blog/tags/git/', blog: 'true' },
  { path: '/blog/series/the-santi020k-way/', blog: 'true' }
]

const expectPathname = async (page: Page, pathname: string) => {
  await expect.poll(() => new URL(page.url()).pathname).toBe(pathname)
}

const expectCurrentLink = async (link: Locator, state: SectionState) => {
  if (state) await expect(link).toHaveAttribute('aria-current', state)
  else await expect(link).not.toHaveAttribute('aria-current')
}

const expectDesktopSection = async (page: Page, state: SectionState) => {
  const navigation = page.locator('.site-desktop-nav')
  const blog = navigation.locator('a[href="/blog/"]')

  await expectCurrentLink(blog, state)
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(state === 'true' ? 0 : 1)
  await expect(navigation.locator('[aria-current="true"]')).toHaveCount(state === 'true' ? 1 : 0)
  // Pages and their descendant routes share the same visible active marker.
  expect(await blog.evaluate(element => getComputedStyle(element, '::after').content !== 'none')).toBe(state !== null)
}

const openMobileMenu = async (page: Page) => {
  await page.locator('[data-mobile-nav-toggle]').click()
  await expect(page.locator('#mobile-nav')).toBeVisible()
}

const expectMobileSection = async (page: Page, state: SectionState) => {
  const navigation = page.locator('#mobile-nav')
  const blog = navigation.locator('a[href="/blog/"]')

  await expectCurrentLink(blog, state)
  await expect(blog.locator(':scope > :nth-child(2)')).toHaveCSS('text-decoration-line', state ? 'underline' : 'none')
  // "Current" names only the exact page, never a parent section.
  await expect(blog.locator('.site-mobile-nav-current')).toHaveCount(state === 'page' ? 1 : 0)
  await expect(navigation.locator('.site-mobile-nav-current')).toHaveCount(state === 'true' ? 0 : 1)
  await expect(navigation.locator('[aria-current="page"] .site-mobile-nav-current')).toHaveCount(state === 'true' ? 0 : 1)
}

test('desktop navigation separates the current page from its current section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const { path, blog } of blogSectionRoutes) {
    await page.goto(path)
    await expectDesktopSection(page, blog)
  }

  const results = await new AxeBuilder({ page }).include('header').analyze()

  expect(results.violations).toEqual([])

  const navigation = page.locator('.site-desktop-nav')

  // Native header links update the semantics after each client-side swap.
  await navigation.locator('a[href="/blog/"]').click()
  await expectPathname(page, '/blog/')
  await expectDesktopSection(page, 'page')

  await navigation.locator('a[href="/about/"]').click()
  await expectPathname(page, '/about/')
  await expectDesktopSection(page, null)
  await expect(navigation.locator('a[href="/about/"]')).toHaveAttribute('aria-current', 'page')
})

test('the phone menu labels only the exact route as Current', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const { path, blog } of blogSectionRoutes) {
    await page.goto(path)
    await openMobileMenu(page)
    await expectMobileSection(page, blog)
    await page.keyboard.press('Escape')
    await expect(page.locator('#mobile-nav')).toBeHidden()
  }

  const navigation = page.locator('#mobile-nav')

  await openMobileMenu(page)
  await navigation.locator('a[href="/blog/"]').click()
  await expectPathname(page, '/blog/')
  await expect(navigation).toBeHidden()
  await openMobileMenu(page)
  await expectMobileSection(page, 'page')

  await navigation.locator('a[href="/about/"]').click()
  await expectPathname(page, '/about/')
  await openMobileMenu(page)
  await expectMobileSection(page, null)
  await expect(navigation.locator('a[href="/about/"] .site-mobile-nav-current')).toBeVisible()
})

test('the open menu keeps header utilities and close reachable by keyboard', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const toggle = page.locator('[data-mobile-nav-toggle]')
  const firstLink = page.locator('[data-mobile-nav-link]').first()
  const { previous: previousKey, next: nextKey } = {
    chromium: { previous: 'Shift+Tab', next: 'Tab' },
    firefox: { previous: 'Shift+Tab', next: 'Tab' },
    webkit: { previous: 'Alt+Shift+Tab', next: 'Alt+Tab' }
  }[browserName]

  await toggle.press('Enter')
  await expect(firstLink).toBeFocused()

  for (const link of await page.locator('[data-mobile-nav-link]').all()) {
    await expect(link).toBeFocused()
    await page.keyboard.press(nextKey)
  }

  const actions = page.locator('[data-mobile-nav-actions] a')

  await expect(actions).toHaveCount(3)
  for (const link of await actions.all()) {
    await expect(link).toBeFocused()
    await page.keyboard.press(nextKey)
  }
  await expect(page.locator('.site-header-brand')).toBeFocused()
  await firstLink.focus()
  await page.keyboard.press(previousKey)
  await expect(toggle).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-theme-toggle-btn]')).toBeFocused()
  await page.keyboard.press(previousKey)
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#site-search-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-site-search-trigger]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(toggle).toBeFocused()
})

test('the mobile frame stays joined through closing and rapid reopening', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const toggle = page.locator('[data-mobile-nav-toggle]')
  const panel = page.locator('[data-mobile-nav-panel]')
  const backdrop = page.locator('[data-mobile-nav-backdrop]')

  await toggle.click()
  await expect(page.locator('[data-mobile-nav-link]').last()).toHaveCSS('opacity', '1')
  // Capture the closing frame and reopen in one task, before its exit animation can finish.
  const closingState = await toggle.evaluate(button => {
    if (!(button instanceof HTMLButtonElement)) throw new TypeError('Expected a menu button')

    const root = button.closest('[data-mobile-nav]')
    const menu = root?.querySelector('[data-mobile-nav-panel]')
    const overlay = root?.querySelector('[data-mobile-nav-backdrop]')

    if (!(menu instanceof HTMLElement) || !(overlay instanceof HTMLElement)) {
      throw new TypeError('Expected a mobile menu and backdrop')
    }

    button.click()

    const state = {
      expanded: button.getAttribute('aria-expanded'),
      panelInert: menu.inert,
      backdropVisible: !overlay.hidden && overlay.getClientRects().length > 0 &&
        getComputedStyle(overlay).visibility === 'visible',
      scrollLocked: document.documentElement.classList.contains('mobile-nav-open')
    }

    button.click()

    return state
  })
  expect(closingState).toEqual({
    expanded: 'false',
    panelInert: true,
    backdropVisible: true,
    scrollLocked: true
  })
  await expect.poll(() => panel.evaluate(element => element.getAnimations({ subtree: true })
    .filter(animation => animation.playState === 'running').length)).toBe(0)
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveAttribute('inert')
  await expect(page.locator('[data-mobile-nav-link]').first()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(backdrop).toBeHidden()
  await expect(page.locator('html')).not.toHaveClass(/mobile-nav-open/)
})

test('reduced motion reveals every menu row immediately without a stagger', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-mobile-nav-toggle]').click()

  for (const link of await page.locator('[data-mobile-nav-link]').all()) {
    await expect(link).toHaveCSS('animation-name', 'none')
    await expect(link).toHaveCSS('opacity', '1')
  }

  await expect(page.locator('[data-mobile-nav-backdrop]')).toHaveCSS('animation-name', 'none')
})

test('the menu follows the dock after scrolling and closes on desktop resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => {
    window.scrollTo(0, 500)
  })
  await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
  await page.locator('[data-mobile-nav-toggle]').click()

  const shell = requireValue(await page.locator('[data-header-shell]').boundingBox())
  const panel = requireValue(await page.locator('[data-mobile-nav-panel]').boundingBox())

  expect(Math.abs(panel.y - (shell.y + shell.height))).toBeLessThanOrEqual(1)
  expect(panel.x).toBe(shell.x)
  expect(panel.width).toBe(shell.width)

  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.locator('#mobile-nav')).toBeHidden()
  await expect(page.locator('.site-desktop-nav')).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/mobile-nav-open/)
})

test('the icon-only desktop search works by pointer and keyboard shortcut', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/about/')

  const search = page.getByRole('button', { name: 'Open site search' })

  await expect(search).toHaveText('')
  await expect(search).toHaveAccessibleName('Open site search (Ctrl/⌘ K)')
  await expect(search).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
  const triggerAudit = await new AxeBuilder({ page })
    .include('[data-site-search-trigger]')
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .analyze()

  expect(triggerAudit.violations).toEqual([])

  // The icon keeps a square touch target even when the full bar has spare space.
  const searchBox = requireValue(await search.boundingBox())

  expect(searchBox.width).toBeGreaterThanOrEqual(44 - 0.005)
  expect(searchBox.width).toBeCloseTo(searchBox.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  await search.click()
  await expect(page.locator('#site-search-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(search).toBeFocused()

  for (const shortcut of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(shortcut)
    await expect(page.locator('#site-search-input')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(search).toBeFocused()
  }
})

for (const theme of ['light', 'dark']) {
  test(`the phone menu labels its toggle and current destination in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(selectedTheme => {
      localStorage.setItem('theme', selectedTheme)
    }, theme)
    await page.goto('/about/')

    const toggle = page.getByRole('button', { name: /^(Menu|Close) navigation$/ })
    const label = toggle.locator('[data-mobile-nav-toggle-label]')

    expect(requireValue(await label.boundingBox()).width).toBeGreaterThan(20)
    await toggle.press('Enter')
    await expect(toggle).toHaveAccessibleName('Close navigation')

    const current = page.locator('#mobile-nav [aria-current="page"]')

    await expect(current).toHaveCount(1)
    await expect(current).toHaveAccessibleName('About')
    await expect(current.locator('.site-mobile-nav-current')).toBeVisible()

    const results = await new AxeBuilder({ page }).include('header').analyze()

    expect(results.violations).toEqual([])
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAccessibleName('Menu navigation')
  })
}

test('the tablet menu preserves reading order and reflows when text is enlarged', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/about/')
  await page.locator('[data-mobile-nav-toggle]').click()

  const links = page.locator('[data-mobile-nav-link]')
  const first = requireValue(await links.nth(0).boundingBox())
  const second = requireValue(await links.nth(1).boundingBox())
  const third = requireValue(await links.nth(2).boundingBox())

  expect(second.y).toBe(first.y)
  expect(second.x).toBeGreaterThan(first.x + first.width)
  expect(third.y).toBeGreaterThan(first.y)
  expect(third.x).toBe(first.x)

  for (const link of await links.all()) {
    await expect(link).toBeFocused()
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
  }

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await expect.poll(async () => {
    const firstEnlarged = requireValue(await links.nth(0).boundingBox())
    const secondEnlarged = requireValue(await links.nth(1).boundingBox())

    return secondEnlarged.y > firstEnlarged.y && secondEnlarged.x === firstEnlarged.x
  }).toBe(true)
  await links.last().focus()
  await expect(links.last()).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-nav')).toBeHidden()
})

test('the contact action stays inside a narrow menu with doubled text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px'
  })
  await page.locator('[data-mobile-nav-toggle]').click()

  const contact = page.locator('[data-mobile-nav-actions] .site-nav-contact')

  await contact.focus()
  await expect(contact).toBeInViewport()
  const bounds = requireValue(await contact.boundingBox())
  const label = requireValue(await contact.locator('.site-nav-contact-label').boundingBox())

  expect(label.x).toBeGreaterThanOrEqual(bounds.x)
  expect(label.x + label.width).toBeLessThanOrEqual(bounds.x + bounds.width)
  expect(await contact.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
})
