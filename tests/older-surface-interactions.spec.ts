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
    await Promise.all(element.getAnimations({ subtree: true })
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

const partiallyExposeTopic = async (target: Locator) => {
  const clipped = await target.evaluate(element => {
    const filter = element.closest<HTMLElement>('[data-blog-tag-filter]')

    if (!filter || filter.scrollWidth <= filter.clientWidth) return
    // Model a horizontally swiped strip with only the beginning of a topic showing.
    const visibleStart = filter.getBoundingClientRect().right - 100

    filter.scrollLeft += element.getBoundingClientRect().left - visibleStart
    return { right: element.getBoundingClientRect().right, edge: filter.getBoundingClientRect().right }
  })

  if (clipped) expect(clipped.right).toBeGreaterThan(clipped.edge)
}

const clickVisibleTopicStart = async (page: Page, target: Locator) => {
  // The leading decorative hash is fully visible; coordinate clicks cannot auto-scroll.
  await expect(page.locator('html')).not.toHaveAttribute('data-astro-transition')
  const box = await target.locator('span').first().boundingBox()

  if (!box) throw new Error('Expected a visible topic label')
  await expectInsideViewport(target.locator('span').first())
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
}

const expectNearestTopic = async (target: Locator) => {
  const position = await target.evaluate(element => {
    const filter = element.closest<HTMLElement>('[data-blog-tag-filter]')

    if (!filter || filter.scrollWidth <= filter.clientWidth) return
    return {
      right: element.getBoundingClientRect().right,
      edge: filter.getBoundingClientRect().right - Number.parseFloat(getComputedStyle(filter).scrollPaddingRight)
    }
  })

  if (position) expect(position.right).toBeCloseTo(position.edge, 0)
}

const expectScrolledStrip = (width: number, scrollLeft: number) => {
  if (width === 390) expect(scrollLeft).toBeGreaterThan(0)
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Older surfaces ${width}px / ${textSize}% / ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme })

        test('topic navigation preserves keyboard position and the mobile scroll strip', async ({ page, browserName }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await setTextSize(page, textSize)
          await page.goto('/blog/')
          await page.evaluate(() => document.fonts.ready)
          const tab = tabKey(browserName)
          const filter = page.locator('[data-blog-tag-filter]')
          const react = filter.locator('a[href="/blog/tags/react/"]')

          await tabTo(page, react, tab)
          await expect(react).toBeFocused()
          await react.evaluate(element => {
            element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
          })
          const position = await filter.evaluate(element => ({
            top: element.getBoundingClientRect().top,
            left: element.scrollLeft
          }))

          expectScrolledStrip(width, position.left)
          await page.keyboard.press('Enter')
          await expect(page).toHaveURL('/blog/tags/react/')
          await expect(react).toHaveAttribute('aria-current', 'page')
          await expect(react).toBeFocused()
          await expect(page.locator('html')).toHaveCSS('font-size', `${textSize * 0.16}px`)
          await expect.poll(() => filter.evaluate(element => element.getBoundingClientRect().top))
            .toBeCloseTo(position.top, 0)
          await expect.poll(() => filter.evaluate(element => element.scrollLeft)).toBeCloseTo(position.left, 0)
          await expectInsideViewport(react)
          await expect(react).toHaveCSS('outline-style', 'solid')
          await page.keyboard.press(tab)
          const nextTopic = filter.locator('a[href="/blog/tags/nextjs/"]')

          await expect(nextTopic).toBeFocused()
          await partiallyExposeTopic(nextTopic)
          const nextPosition = await filter.evaluate(element => ({
            top: element.getBoundingClientRect().top,
            left: element.scrollLeft
          }))

          // Pointer activation of an inner label also restores the selected link.
          await clickVisibleTopicStart(page, nextTopic)
          await expect(page).toHaveURL('/blog/tags/nextjs/')
          await expect(nextTopic).toHaveAttribute('aria-current', 'page')
          await expect(nextTopic).toBeFocused()
          await expectInsideViewport(nextTopic)
          // A partly visible pointer target may move just enough to reveal its full outline.
          expect(await filter.evaluate(element => element.scrollLeft)).toBeGreaterThanOrEqual(nextPosition.left)
          await expectNearestTopic(nextTopic)
          await expect.poll(() => filter.evaluate(element => element.getBoundingClientRect().top))
            .toBeCloseTo(nextPosition.top, 0)

          const allPosts = filter.getByRole('link', { name: 'All posts', exact: true })

          await allPosts.focus()
          await allPosts.press('Enter')
          await expect(page).toHaveURL('/blog/')
          await expect(allPosts).toHaveAttribute('aria-current', 'page')
          await expect(allPosts).toBeFocused()
          await expectInsideViewport(allPosts)
          await expectNoUnexpectedAccessibilityViolations(page)

          // A later navigation outside the filter still follows the page-focus contract.
          const firstPost = page.locator('[data-post-gallery-card] a').first()

          await firstPost.focus()
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

        test('series steps expose the same arrow and colors to keyboard and pointer users', async ({ page, browserName }) => {
          await setTextSize(page, textSize)
          await page.goto(article)
          await page.evaluate(() => document.fonts.ready)
          const step = page.locator('[data-series-step]:not([aria-current])').first()
          const arrow = step.locator(':scope > :last-child')
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
          await expect(arrow).toHaveCSS('opacity', '1')
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
          await expect(arrow).toHaveCSS('translate', '0px')
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
