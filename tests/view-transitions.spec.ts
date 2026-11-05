import { expect, type Locator, type Page, test } from '@playwright/test'

const observeTransition = async (page: Page) => {
  await page.evaluate(() => {
    const startTransition = document.startViewTransition.bind(document)

    document.startViewTransition = options => {
      const transition = startTransition(options)

      void transition.ready.then(() => {
        const root = document.documentElement
        const animations = document.getAnimations().filter(animation => {
          const effect = animation.effect

          return effect instanceof KeyframeEffect && effect.pseudoElement?.startsWith('::view-transition')
        })
        const targets = animations.map(animation => {
          const effect = animation.effect

          return effect instanceof KeyframeEffect ? effect.pseudoElement : null
        })

        const shellAnimated = targets.some(target => target && /\((site-header|site-progress)\)/u.test(target))

        root.dataset.transitionShellAnimated = String(shellAnimated)
        root.dataset.transitionContentAnimated = String(targets.includes('::view-transition-new(root)'))
        root.dataset.transitionContentResized = String(targets.includes('::view-transition-group(root)'))
        root.dataset.transitionAnimationCount = String(animations.length)
        const header = document.querySelector('.site-header')

        root.dataset.transitionHeaderName = header ? getComputedStyle(header).viewTransitionName : ''
        root.dataset.transitionReady = 'true'

        return undefined
      }).catch(() => {
        document.documentElement.dataset.transitionReady = 'rejected'
      })

      return transition
    }
  })
}

const openMainMenu = async (page: Page) => {
  const toggle = page.locator('[data-mobile-nav-toggle]')

  if (!(await toggle.isVisible())) return

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
}

// Observe every paint for the original 500ms stability window, so a delayed
// focus scroll cannot hide behind an eventual-success assertion.
const expectStableTop = async (locator: Locator, expected: number) => {
  const positions = await locator.evaluate(async element => {
    const values: number[] = []
    const deadline = performance.now() + 500

    do {
      values.push(element.getBoundingClientRect().top)
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          resolve()
        })
      })
    } while (performance.now() < deadline)

    values.push(element.getBoundingClientRect().top)
    return values
  })

  for (const position of positions) expect(position).toBeCloseTo(expected, 0)
}

test.describe('View transitions', () => {
  for (const width of [375, 1440]) {
    for (const theme of ['light', 'dark']) {
      test(`keeps the shell steady without stretching content at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'no-preference' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto('/')
        await observeTransition(page)
        await openMainMenu(page)
        await page.locator('nav[aria-label="Main menu"] a[href="/about/"]:visible').click()

        const root = page.locator('html')

        await expect(root).toHaveAttribute('data-transition-ready', 'true')
        await expect(root).toHaveAttribute('data-transition-shell-animated', 'false')
        await expect(root).toHaveAttribute('data-transition-content-animated', 'true')
        await expect(root).toHaveAttribute('data-transition-content-resized', 'false')
        await expect(root).toHaveAttribute('data-transition-header-name', 'site-header')
        await expect(root).toHaveAttribute('data-theme', theme)
        await expect(page.locator('#main')).toBeFocused()
        await expect(page.locator('.site-desktop-nav [aria-current="page"]')).toHaveText('About')
        await expect(root).not.toHaveAttribute('data-astro-transition')
        await expect(page.locator('.site-header')).toHaveCSS('view-transition-name', 'none')
        await expect(page.locator('body')).toHaveAttribute('data-client-navigation', '')

        const entranceAnimations = await page.locator('#main .animate-slide-up, #main .animate-reveal-lcp, .site-header [data-ui-logo-draw]').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName))

        expect(entranceAnimations.length).toBeGreaterThan(0)
        expect(entranceAnimations.every(name => name === 'none')).toBe(true)
        await expect(page.locator('.site-header [data-ui-logo-draw]').first()).toHaveCSS('stroke-dashoffset', '0px')
      })
    }
  }

  test('keeps article covers connected through navigation and restores history scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/blog/')
    await observeTransition(page)

    const card = page.locator('[data-post-gallery-card]').first()
    const cover = card.locator('[data-post-gallery-cover]')

    await card.scrollIntoViewIfNeeded()
    await card.getByRole('link').focus()

    const name = await cover.evaluate(element => getComputedStyle(element).viewTransitionName)
    const scrollY = await page.evaluate(() => window.scrollY)

    expect(name).toMatch(/^post-cover-/u)
    await card.getByRole('link').press('Enter')
    await expect(page.locator('[data-article-opening]')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-transition-ready', 'true')
    await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')

    const names = await page.locator('[data-post-cover] *').evaluateAll(elements => elements.map(element => getComputedStyle(element).viewTransitionName))

    expect(names.filter(value => value === name)).toHaveLength(1)
    await page.goBack()
    await expect(page).toHaveURL(/\/blog\/$/u)
    await expect(page.locator('html')).toHaveAttribute('data-transition-ready', 'true')
    await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scrollY, 0)
    await expect(card).toBeInViewport()
  })

  test('navigates without snapshot or entrance animations with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await observeTransition(page)
    await openMainMenu(page)
    await page.locator('nav[aria-label="Main menu"] a[href="/about/"]:visible').click()
    await expect(page.locator('html')).toHaveAttribute('data-transition-ready', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-transition-animation-count', '0')
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.locator('#nav-progress')).toBeHidden()
  })

  test('uses an immediate client swap when native view transitions are unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
    })
    await page.goto('/')
    await page.locator('#nav-progress').evaluate(element => {
      element.dataset.transitionTest = 'fallback'
    })
    await openMainMenu(page)
    await page.locator('nav[aria-label="Main menu"] a[href="/about/"]:visible').click()
    await expect(page).toHaveURL(/\/about\/$/u)
    await expect(page.locator('#nav-progress')).toHaveAttribute('data-transition-test', 'fallback')
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')
    await expect(page.locator('body')).toHaveAttribute('data-client-navigation', '')
  })

  test('starts each navigation near zero and advances the visible progress bar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')

    const progress = page.locator('#nav-progress')

    await expect(progress).toHaveCSS('opacity', '0')

    await openMainMenu(page)

    await page.route('**/about/', async route => {
      await new Promise(resolve => setTimeout(resolve, 1200))
      await route.continue()
    })

    const about = page.getByRole('navigation', { name: 'Main menu' }).first().getByRole('link', { name: 'About' })

    await about.evaluate(link => {
      link.setAttribute('data-astro-prefetch', 'false')
    })
    await about.click()
    await expect(progress).toHaveClass(/is-loading/)

    const fractions = await progress.evaluate(async bar => {
      const values: number[] = []

      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise<void>(resolve => requestAnimationFrame(() => {
          resolve()
        }))
        values.push(bar.getBoundingClientRect().width / window.innerWidth)
      }

      return values
    })

    expect(fractions[0]).toBeLessThan(0.3)
    for (let index = 1; index < fractions.length; index += 1) {
      expect(fractions[index]).toBeGreaterThanOrEqual(fractions[index - 1] ?? 0)
    }
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(progress).toHaveClass(/is-complete/)
    await expect(progress).toHaveCSS('opacity', '0')
  })

  test('keeps global transition UI working after a body swap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    const progress = page.locator('#nav-progress')
    await progress.evaluate(element => {
      element.dataset.transitionTest = 'persistent'
    })

    await page
      .getByRole('navigation', { name: 'Main menu' })
      .first()
      .getByRole('link', { name: 'About' })
      .click()

    await expect(page).toHaveURL(/\/about\/$/)
    await expect(progress).toHaveAttribute('data-transition-test', 'persistent')
    await expect(page.locator('#main')).toBeFocused()

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })
    await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')

    await page.route('**/blog/', async route => {
      await new Promise(resolve => setTimeout(resolve, 400))
      await route.continue()
    })

    await page
      .getByRole('navigation', { name: 'Main menu' })
      .first()
      .getByRole('link', { name: 'Blog' })
      .click()

    await expect(progress).toHaveClass(/is-loading/)
    await expect(page).toHaveURL(/\/blog\/$/)
    await expect(progress).toHaveClass(/is-complete/)
  })

  test('preserves a cross-page fragment target', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.id = 'transition-fragment-test'
      link.href = '/portfolio/smith-commerce/#technologies'
      link.textContent = 'View technologies'
      document.body.append(link)
    })

    await page.locator('#transition-fragment-test').click()

    await expect(page).toHaveURL(/\/portfolio\/smith-commerce\/#technologies$/)
    await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
    await expect(page.locator('#technologies')).toBeInViewport()
    await expect(page.locator('#main')).not.toBeFocused()
  })

  test('topic navigation opens the new archive without restoring an obsolete selected pill', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/blog/')
    for (const [path, heading] of [['react', 'React'], ['typescript', 'TypeScript']] as const) {
      await page.locator(`[data-blog-tag-filter] a[href="/blog/tags/${path}/"]`).press('Enter')
      await expect(page).toHaveURL(`/blog/tags/${path}/`)
      await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
      await expect(page.locator('#main')).toBeFocused()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      const main = page.locator('#main')
      await expectStableTop(main, await main.evaluate(element => element.getBoundingClientRect().top))
    }

    await page.locator('[data-topic-archive-blog]').press('Enter')
    await expect(page).toHaveURL('/blog/')
    await expect(page.locator('#main')).toBeFocused()
    await expect(page.locator('[data-blog-tag-filter]').getByRole('link', { name: 'All posts' })).toHaveAttribute('aria-current', 'page')
  })

  test('disables smooth scrolling when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const scrollBehavior = await page.locator('html').evaluate(
      element => getComputedStyle(element).scrollBehavior
    )

    expect(scrollBehavior).toBe('auto')
  })
})
