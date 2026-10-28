import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'

const setTextSize = async (page: Page, textSize: number) => {
  await page.addInitScript(size => {
    // A simulated browser text preference must survive Astro document swaps.
    document.addEventListener('astro:before-swap', event => {
      const { newDocument } = event

      newDocument.documentElement.style.fontSize = `${size}%`
    })
    const apply = () => {
      const root = document.querySelector('html')

      if (!root) return false
      root.style.fontSize = `${size}%`
      return true
    }

    if (!apply()) {
      const observer = new MutationObserver(() => {
        if (apply()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
  }, textSize)
}

const finishAnimations = async (target: Locator) => {
  await target.evaluate(async element => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
    const animations = element.getAnimations({ subtree: true })

    // Bounding boxes also include transforms from the cover's entrance-animation ancestors.
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      animations.push(...ancestor.getAnimations())
    }

    await Promise.all(animations
      .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
      .map(animation => animation.finished.catch(() => undefined)))
  })
}

const coverAppearance = (cover: Locator) => cover.evaluate(element => [element, ...element.querySelectorAll('*')].map(node => {
  const style = getComputedStyle(node)
  const rect = node.getBoundingClientRect()

  return {
    width: rect.width,
    height: rect.height,
    scale: style.scale,
    transform: style.transform,
    shadow: style.boxShadow,
    opacity: style.opacity,
    background: style.backgroundImage
  }
}))

const tabKey = (browserName: string) => browserName === 'webkit' ? 'Alt+Tab' : 'Tab'

const tabTo = async (page: Page, target: Locator, key: string) => {
  for (let step = 0; step < 80; step++) {
    await page.keyboard.press(key)
    if (await target.evaluate(element => element === document.activeElement)) return
  }
  throw new Error('Topic link is not reachable in the tab order')
}

const expectInsideViewport = async (target: Locator) => {
  const bounds = await target.evaluate(element => {
    const rect = element.getBoundingClientRect()

    return { left: rect.left, right: rect.right, width: innerWidth }
  })

  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1)
}

const clickVisibleTopicLabel = async (page: Page, target: Locator) => {
  // Activate the inner label to exercise pointer focus restoration after the swap.
  await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')
  const label = target.locator('[data-sculpted-tag-label]')
  const box = await label.boundingBox()

  if (!box) throw new Error('Expected a visible topic label')
  await expectInsideViewport(label)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

const expectWrappingTopics = async (filter: Locator) => {
  const overflow = await filter.evaluate(element => element.scrollWidth - element.clientWidth)

  expect(overflow, 'All topic links remain available without horizontal scrolling').toBeLessThanOrEqual(1)
  for (const link of await filter.getByRole('link').all()) await expectInsideViewport(link)
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Older surfaces ${width}px / ${textSize}% / ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme })

        test('wrapping topic navigation keeps keyboard access and opens each archive at its heading', async ({ page, browserName }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await setTextSize(page, textSize)
          await page.goto('/blog/')
          await page.evaluate(() => document.fonts.ready)
          const tab = tabKey(browserName)
          const filter = page.locator('[data-blog-tag-filter]')
          const react = filter.locator('a[href="/blog/tags/react/"]')

          await tabTo(page, react, tab)
          await expect(react).toBeFocused()
          await expect(react).toHaveCSS('outline-style', 'solid')
          await expectWrappingTopics(filter)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL('/blog/tags/react/')
          await expect(page.locator('#main')).toBeFocused()
          await expect(page.locator('html')).toHaveCSS('font-size', `${textSize * 0.16}px`)
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
          await expectWrappingTopics(filter)

          const nextTopic = filter.locator('a[href="/blog/tags/nextjs/"]')
          await tabTo(page, nextTopic, tab)
          await expect(nextTopic).toBeFocused()
          await expect(nextTopic).toHaveCSS('outline-style', 'solid')
          await expectInsideViewport(nextTopic)
          await clickVisibleTopicLabel(page, nextTopic)
          await expect(page).toHaveURL('/blog/tags/nextjs/')
          await expect(page.locator('#main')).toBeFocused()
          await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
          await expectWrappingTopics(filter)

          await page.locator('[data-topic-archive-blog]').press('Enter')
          await expect(page).toHaveURL('/blog/')
          await expect(filter.getByRole('link', { name: 'All posts', exact: true })).toHaveAttribute('aria-current', 'page')
          await expect(page.locator('#main')).toBeFocused()
          await expectNoUnexpectedAccessibilityViolations(page)

          const firstPost = page.locator('[data-post-gallery-card] a').first()
          await firstPost.press('Enter')
          await expect(page.locator('[data-post-cover]')).toBeAttached()
          await expect(page.locator('#main')).toBeFocused()
        })

        test('passive article and project covers remain still on hover', async ({ page }) => {
          await setTextSize(page, textSize)
          for (const [route, selector] of [[article, '[data-post-cover]'], ['/portfolio/lumen-ui/', '[data-project-cover]']] as const) {
            await page.goto(route)
            await page.evaluate(() => document.fonts.ready)
            const cover = page.locator(selector)

            for (const reducedMotion of ['no-preference', 'reduce'] as const) {
              await page.emulateMedia({ reducedMotion })
              await cover.scrollIntoViewIfNeeded()
              await page.mouse.move(0, 0)
              await finishAnimations(cover)
              const before = await coverAppearance(cover)

              await cover.hover()
              await finishAnimations(cover)
              expect(await coverAppearance(cover)).toEqual(before)
              await expectInsideViewport(cover)
              await expect.poll(() => cover.locator('img').evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true)
            }
          }
        })

        test('series steps expose the same reading emphasis to keyboard and pointer users', async ({ page, browserName }) => {
          await page.route('https://giscus.app/**', route => route.abort())
          await setTextSize(page, textSize)
          await page.goto(article)
          await page.evaluate(() => document.fonts.ready)
          await page.locator('[data-series-fold-summary]').focus()
          await page.keyboard.press('Enter')
          const step = page.locator('[data-series-step]:not([aria-current])').first()

          await expect(step).toBeVisible()
          const appearance = () => step.evaluate(element => [element, ...element.children].map(node => {
            const style = getComputedStyle(node)

            return { background: style.backgroundColor, color: style.color, opacity: style.opacity }
          }))

          await page.keyboard.press(tabKey(browserName))
          await step.focus()
          await step.evaluate(element => {
            element.scrollIntoView({ behavior: 'instant', block: 'center' })
          })
          await finishAnimations(step)
          await expect(step).toHaveCSS('outline-style', 'solid')
          await expectInsideViewport(step)
          const focused = await appearance()

          await step.evaluate(element => {
            if (element instanceof HTMLElement) element.blur()
          })
          await step.hover()
          await finishAnimations(step)
          expect(await appearance()).toEqual(focused)
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await expect(step).toHaveCSS('transition-property', 'none')
          await expectNoUnexpectedAccessibilityViolations(page)
          const destination = await step.getAttribute('href')

          await step.focus()
          await step.press('Enter')
          await expect(page).toHaveURL(destination ?? '')
        })
      })
    }
  }
}
