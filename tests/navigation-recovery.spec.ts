import { expect, type Page, test } from '@playwright/test'

import { requireValue } from './helpers/assertions'

const filterSelector = '[data-blog-tag-filter]'

const progress = (page: Page) => page.locator('#nav-progress')

const currentPath = (page: Page) => new URL(page.url()).pathname

const scrollToY = (page: Page, top: number) => page.evaluate(target => {
  window.scrollTo({ behavior: 'instant', top: target })

  return window.scrollY
}, top)

// Astro saves each entry's position in history.state after scrollend. Waiting for it
// means traversal and reload start from a known saved position instead of a race.
const savedHistoryY = (page: Page) => page.evaluate(() => {
  const state: unknown = history.state

  return typeof state === 'object' && state !== null && 'scrollY' in state && typeof state.scrollY === 'number' ?
    state.scrollY :
    null
})

// Record one observation per client navigation: window.scrollY synchronously inside
// astro:after-swap, then a marker at astro:page-load. Astro replaces root attributes
// during the swap and both are cleared here, so a stale value cannot satisfy a wait.
const armNavigation = (page: Page) => page.evaluate(() => {
  const root = document.documentElement
  let departureY: number | undefined

  delete root.dataset.recoverySwapY
  delete root.dataset.recoveryLoaded
  delete root.dataset.recoveryDepartureY
  document.addEventListener('astro:before-preparation', () => {
    departureY = window.scrollY
  }, { once: true })
  document.addEventListener('astro:after-swap', () => {
    root.dataset.recoverySwapY = String(window.scrollY)

    if (departureY !== undefined) root.dataset.recoveryDepartureY = String(departureY)
  }, { once: true })
  document.addEventListener('astro:page-load', () => {
    root.dataset.recoveryLoaded = ''
  }, { once: true })
})

const settleNavigation = async (page: Page, swapY: number) => {
  const root = page.locator('html')

  await expect(root).toHaveAttribute('data-recovery-swap-y', String(swapY))
  await expect(root).toHaveAttribute('data-recovery-loaded', '')
}

// Check beyond the swap event: a queued browser scroll-anchor adjustment runs
// at rendering time and can otherwise overwrite a correctly restored position.
const expectSettledPosition = async (page: Page, top: number) => {
  await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')

  const positions = await page.evaluate(async () => {
    const samples: number[] = []

    for (let frame = 0; frame < 3; frame++) {
      await new Promise<void>(resolve => requestAnimationFrame(() => {
        resolve()
      }))

      samples.push(window.scrollY)
    }

    return samples
  })

  expect(positions).toEqual([top, top, top])

  if (await page.evaluate(() => CSS.supports('overflow-anchor', 'auto'))) {
    await expect(page.locator('html')).toHaveCSS('overflow-anchor', 'auto')
  }
}

// Use a later topic so the selected state is exercised beyond the first mobile row.
const resolveLaterTopic = async (page: Page) => {
  await page.goto('/blog/')

  return requireValue(await page.locator(filterSelector).locator('a[href]').last().getAttribute('href'))
}

// Related archive links wrap without moving the direct or history-restored page.
const expectRelatedTopicsContained = async (page: Page, href: string, scrollY: number) => {
  const related = page.getByRole('navigation', { name: 'Related topics' })
  const fit = await related.evaluate(strip => ({
    overflows: strip.scrollWidth > strip.clientWidth,
    contained: [...strip.querySelectorAll('a')].every(link => {
      const pill = link.getBoundingClientRect()
      const bounds = strip.getBoundingClientRect()

      return pill.left >= Math.max(bounds.left, 0) && pill.right <= Math.min(bounds.right, innerWidth)
    }),
    scrollY: window.scrollY
  }))

  expect(fit).toEqual({ overflows: false, contained: true, scrollY })
  await expect(related.locator(`a[href="${href}"]`)).toHaveCount(0)
  await expect(related.locator('[aria-current]')).toHaveCount(0)
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  const scrollBehavior = reducedMotion === 'reduce' ? 'auto' : 'smooth'

  test.describe(`history scroll recovery (${reducedMotion} motion)`, () => {
    test.use({ reducedMotion, viewport: { width: 1500, height: 900 } })

    for (const width of [390, 1500]) {
      for (const fallback of [false, true]) {
        test(`Back and Forward restore saved positions at ${width}px with ${fallback ? 'fallback' : 'native'} transitions`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await page.addInitScript(disableNativeTransitions => {
            if (disableNativeTransitions) {
              Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
            }
          }, fallback)
          await page.goto('/blog/')
          await expect(progress(page)).toHaveClass(/is-complete/u)
          await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)

          const card = page.locator('[data-post-gallery-card]').nth(3)
          const link = card.getByRole('link')
          const cardTop = await card.evaluate(element => element.getBoundingClientRect().top + window.scrollY)
          const archiveY = await scrollToY(page, Math.round(cardTop - 160))
          const articlePath = requireValue(await link.getAttribute('href'))

          expect(archiveY).toBeGreaterThan(0)
          // A fully visible link needs no actionability scroll, so Astro saves archiveY on click.
          await expect(link).toBeInViewport({ ratio: 1 })
          await armNavigation(page)
          await link.click()
          await settleNavigation(page, 0)
          expect(currentPath(page)).toBe(articlePath)
          await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)

          const articleY = await page.evaluate(() => {
            window.scrollTo({
              behavior: 'instant',
              top: Math.min(1200, document.documentElement.scrollHeight - window.innerHeight - 1)
            })

            return window.scrollY
          })

          expect(articleY).toBeGreaterThan(0)
          await expect.poll(() => savedHistoryY(page)).toBe(articleY)

          await armNavigation(page)
          await page.goBack()
          await settleNavigation(page, archiveY)
          expect(currentPath(page)).toBe('/blog/')
          expect(await page.evaluate(() => window.scrollY)).toBe(archiveY)
          await expectSettledPosition(page, archiveY)

          await armNavigation(page)
          await page.goForward()
          await settleNavigation(page, articleY)
          expect(currentPath(page)).toBe(articlePath)
          expect(await page.evaluate(() => window.scrollY)).toBe(articleY)
          await expectSettledPosition(page, articleY)
        })

        test(`keyboard fragment navigation cancels outgoing scrolling at ${width}px with ${fallback ? 'fallback' : 'native'} transitions`, async ({ page }) => {
          await page.setViewportSize({ width, height: 720 })
          await page.addInitScript(disableNativeTransitions => {
            if (disableNativeTransitions) {
              Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
            }
          }, fallback)
          await page.goto('/speaking/')
          await expect(progress(page)).toHaveClass(/is-complete/u)
          await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)
          await armNavigation(page)

          // Focus starts a smooth scroll toward the offscreen caption. Activate
          // immediately so the outgoing scroll is still running during navigation.
          const career = page.getByRole('link', { name: 'Career timeline', exact: true })

          await career.focus()
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL('/work/#experience-heading')
          await expect(page.locator('html')).toHaveAttribute('data-recovery-loaded', '')

          const swapY = Number(requireValue(await page.locator('html').getAttribute('data-recovery-swap-y')))

          expect(swapY).toBeGreaterThan(0)
          await expectSettledPosition(page, swapY)
          await expect(page.locator('#experience-heading')).toBeInViewport({ ratio: 1 })
          // The native fragment owns the focus starting point; see the keyboard suite below.
          await expect(page.locator('#main')).not.toBeFocused()
          await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)
        })
      }
    }

    test('same-page fragment Back and Forward restore before later popstate listeners', async ({ page }) => {
      await page.goto('/blog/')
      await expect(progress(page)).toHaveClass(/is-complete/u)
      await page.getByRole('link', { name: 'Explore the writing' }).press('Enter')
      await expect(page).toHaveURL(/#posts$/u)

      const targetY = await page.locator('#posts').evaluate(element => Math.round(
        element.getBoundingClientRect().top + scrollY -
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) -
        (Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0)
      ))

      await expect.poll(() => page.evaluate(() => scrollY)).toBe(targetY)
      await expect.poll(() => savedHistoryY(page)).toBe(targetY)

      const observeTraversal = () => page.evaluate(() => {
        delete document.documentElement.dataset.recoveryTraversalY
        window.addEventListener('popstate', () => {
          document.documentElement.dataset.recoveryTraversalY = String(scrollY)
        }, { once: true })
      })

      await observeTraversal()
      await page.goBack()
      await expect(page.locator('html')).toHaveAttribute('data-recovery-traversal-y', '0')
      await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)
      await observeTraversal()
      await page.goForward()
      await expect(page.locator('html')).toHaveAttribute('data-recovery-traversal-y', String(targetY))
      await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)
    })

    test('reload restores the saved archive position by DOMContentLoaded', async ({ page }) => {
      // Astro's router module restores history.state before DOMContentLoaded on reload.
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.dataset.recoveryDclY = String(window.scrollY)
        }, { once: true })
      })
      await page.goto('/blog/')
      await expect(progress(page)).toHaveClass(/is-complete/u)

      const archiveY = await scrollToY(page, 1400)

      expect(archiveY).toBeGreaterThan(0)
      await expect.poll(() => savedHistoryY(page)).toBe(archiveY)
      await page.reload()
      await expect(page.locator('html')).toHaveAttribute('data-recovery-dcl-y', String(archiveY))
    })
  })
}

// Describe where sequential navigation landed relative to the fragment target.
const describeNextFocus = (page: Page, targetId: string) => page.evaluate(id => {
  const target = document.getElementById(id)
  const active = document.activeElement

  if (!target || !(active instanceof HTMLElement)) throw new Error('Missing fragment target or focus')

  const bounds = target.getBoundingClientRect()

  return {
    // Tab must reach a real control, not the page container or the document.
    interactive: active.matches('a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex="0"]'),
    followsTarget: Boolean(target.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING) ||
      target.contains(active),
    inHeader: active.closest('header.site-header') !== null,
    visible: active.getClientRects().length > 0,
    // The reader stays in the section: the target remains on screen after Tab.
    targetInView: bounds.bottom > 0 && bounds.top < window.innerHeight
  }
}, targetId)

// Keyboard-activate a temporary in-page link so Astro handles it as a client navigation.
const followInjectedLink = async (page: Page, href: string) => {
  await page.evaluate(destination => {
    const link = document.createElement('a')

    link.href = destination
    link.textContent = 'Injected destination'
    link.dataset.injectedDestination = ''
    document.getElementById('main')?.prepend(link)
  }, href)

  const link = page.locator('[data-injected-destination]')

  await link.focus()
  await page.keyboard.press('Enter')
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test.describe(`cross-page fragment keyboard navigation (${reducedMotion} motion)`, () => {
    test.use({ reducedMotion, viewport: { width: 1280, height: 800 } })

    for (const fallback of [false, true]) {
      test(`next Tab continues after the fragment target with ${fallback ? 'fallback' : 'native'} transitions`, async ({ browserName, page }) => {
        await page.addInitScript(disableNativeTransitions => {
          if (disableNativeTransitions) {
            Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true })
          }
        }, fallback)
        await page.goto('/speaking/')
        await expect(progress(page)).toHaveClass(/is-complete/u)
        await armNavigation(page)
        await page.getByRole('link', { name: 'Career timeline', exact: true }).focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL('/work/#experience-heading')
        await expect(page.locator('html')).toHaveAttribute('data-recovery-loaded', '')

        const swapY = Number(requireValue(await page.locator('html').getAttribute('data-recovery-swap-y')))

        await expectSettledPosition(page, swapY)
        await expect(page.locator('#experience-heading')).toBeInViewport()

        await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')

        expect(await describeNextFocus(page, 'experience-heading')).toEqual({
          interactive: true,
          followsTarget: true,
          inHeader: false,
          visible: true,
          targetInView: true
        })
      })
    }

    test('an encoded fragment keeps sequential focus at its decoded target', async ({ browserName, page }) => {
      await page.goto('/speaking/')
      await expect(progress(page)).toHaveClass(/is-complete/u)
      await armNavigation(page)
      const fragment = 'experience-heading'.replace('e', '%65')

      await followInjectedLink(page, `/work/#${fragment}`)
      await expect(page.locator('html')).toHaveAttribute('data-recovery-loaded', '')

      const swapY = Number(requireValue(await page.locator('html').getAttribute('data-recovery-swap-y')))

      await expectSettledPosition(page, swapY)
      await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab')
      expect(await describeNextFocus(page, 'experience-heading')).toEqual({
        interactive: true,
        followsTarget: true,
        inHeader: false,
        visible: true,
        targetInView: true
      })
    })

    for (const href of ['/work/', '/work/#no-such-section', '/work/#%E0%A4%A']) {
      test(`client navigation to ${href} keeps focus on main content`, async ({ page }) => {
        const errors: Error[] = []

        page.on('pageerror', error => errors.push(error))
        await page.goto('/speaking/')
        await expect(progress(page)).toHaveClass(/is-complete/u)
        await armNavigation(page)
        await followInjectedLink(page, href)
        await expect(page.locator('html')).toHaveAttribute('data-recovery-loaded', '')
        expect(currentPath(page)).toBe('/work/')
        await expect(page.locator('#main')).toBeFocused()
        expect(errors).toEqual([])
      })
    }
  })
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  const scrollBehavior = reducedMotion === 'reduce' ? 'auto' : 'smooth'

  test.describe(`script-free scroll preference (${reducedMotion} motion)`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion })

    test('keeps the original anchor scrolling preference', async ({ page }) => {
      await page.goto('/blog/')
      await expect(page.locator('html')).toHaveCSS('scroll-behavior', scrollBehavior)
    })
  })
}

test.describe('mobile topic filters', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('a direct topic archive contains related links without moving the page', async ({ page }) => {
    const topicHref = await resolveLaterTopic(page)

    await page.goto(topicHref)
    await expect(progress(page)).toHaveClass(/is-complete/u)
    await expectRelatedTopicsContained(page, topicHref, 0)
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
  })

  test('arriving from an article topic and returning through history keep related links contained', async ({ page }) => {
    const topicHref = await resolveLaterTopic(page)

    await page.goto(topicHref)

    const articleHref = requireValue(
      await page.locator('[data-post-gallery-card]').first().getByRole('link').getAttribute('href')
    )

    await page.goto(articleHref)
    await expect(progress(page)).toHaveClass(/is-complete/u)

    // The article's margin topic links live outside the filter strip.
    await armNavigation(page)
    await page.locator('[data-article-topics]').locator(`a[href="${topicHref}"]`).click()
    await settleNavigation(page, 0)
    expect(currentPath(page)).toBe(topicHref)
    await expect(page.locator('#main')).toBeFocused()
    await expectRelatedTopicsContained(page, topicHref, 0)

    const card = page.locator('[data-post-gallery-card]').first()
    const link = card.getByRole('link')
    const cardTop = await card.evaluate(element => element.getBoundingClientRect().top + window.scrollY)
    const topicY = await scrollToY(page, Math.round(cardTop - 120))
    const postPath = requireValue(await link.getAttribute('href'))

    expect(topicY).toBeGreaterThan(0)
    await expect(link).toBeInViewport({ ratio: 1 })

    const pointerPositions = await page.evaluateHandle(() => {
      const positions: number[] = []

      document.addEventListener('pointerdown', () => positions.push(window.scrollY), { once: true })
      return positions
    })

    await armNavigation(page)
    await link.click()
    await settleNavigation(page, 0)
    expect(currentPath(page)).toBe(postPath)

    // Pointer activation can align the link after setup. Restore the position
    // actually captured at navigation start, not the earlier setup scroll.
    const savedTopicY = Number(requireValue(await page.locator('html').getAttribute('data-recovery-departure-y')))

    expect(savedTopicY).toBeGreaterThan(0)
    expect(await pointerPositions.jsonValue()).toEqual([savedTopicY])
    await pointerPositions.dispose()
    await armNavigation(page)
    await page.goBack()
    await settleNavigation(page, savedTopicY)
    expect(currentPath(page)).toBe(topicHref)
    await expectRelatedTopicsContained(page, topicHref, savedTopicY)
  })
})

test('desktop topic filters keep wrapping in place', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 })
  await page.goto('/blog/')

  const strip = page.locator(filterSelector)
  const topicHref = requireValue(await strip.locator('a[href]').last().getAttribute('href'))

  for (const route of ['/blog/', topicHref]) {
    await page.goto(route)
    await expect(progress(page)).toHaveClass(/is-complete/u)

    const layout = await strip.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const pills = Array.from(element.querySelectorAll('a[href]'), link => link.getBoundingClientRect())

      return {
        contained: pills.every(pill => pill.left >= bounds.left && pill.right <= bounds.right),
        overflow: element.scrollWidth - element.clientWidth,
        scrollLeft: element.scrollLeft,
        scrollY: window.scrollY,
        wrap: getComputedStyle(element).flexWrap
      }
    })

    expect(layout).toEqual({ contained: true, overflow: 0, scrollLeft: 0, scrollY: 0, wrap: 'wrap' })
  }
})

test('later archives distinguish the mixed-feed selection from related destinations', async ({ page }) => {
  // Both archives are paginated in shipped content (see blog.spec pagination coverage).
  for (const { archive, firstCurrent, laterCurrent } of [
    { archive: '/blog/', firstCurrent: ['page'], laterCurrent: ['true'] },
    { archive: '/blog/tags/typescript/', firstCurrent: [], laterCurrent: [] }
  ]) {
    await page.goto(archive)

    const selected = page.locator(filterSelector).locator(`a[href="${archive}"]`)
    const pagination = page.getByRole('navigation', { name: 'Pagination' })

    expect(await selected.evaluateAll(links => links.map(link => link.getAttribute('aria-current')))).toEqual(firstCurrent)

    const secondPage = requireValue(
      await pagination.getByRole('link', { exact: true, name: 'Page 2' }).getAttribute('href')
    )

    await page.goto(secondPage)
    expect(await selected.evaluateAll(links => links.map(link => link.getAttribute('aria-current')))).toEqual(laterCurrent)
    await expect(pagination.getByRole('link', { exact: true, name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  }
})
