import { expect, type Locator, type Page, test } from '@playwright/test'

// Lumen's default ratio is unreachable for some groups; those consumers explicitly use zero.
const defaultThreshold = 0.15

const openWithTextSize = async (page: Page, route: string, textSize: number) => {
  await page.addInitScript(size => {
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
  await page.goto(route)
  await page.evaluate(() => document.fonts.ready)
}

// The selected-projects group, bound by the native runtime and still waiting below the fold.
const pendingProjectsGroup = async (page: Page) => {
  const group = page.locator('[data-ui-reveal-group]').last()

  await expect(group).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
  await expect(group).toHaveAttribute('data-ui-reveal-threshold', '0')
  // Let native observation settle while the group is still below the viewport.
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    }))
  }))
  expect(await group.evaluate(element => element.getBoundingClientRect().top > innerHeight),
    'The group must start below the viewport').toBe(true)
  await expect(group).not.toHaveClass(/\bis-revealed\b/u)
  await expect(group.locator(':scope > *').first(),
    'Motion must hide unrevealed cards, or the reveal assertions prove nothing').toHaveCSS('opacity', '0')
  return group
}

const visibleShare = (group: Locator) => group.evaluate(element => {
  const rect = element.getBoundingClientRect()
  const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0))

  return { height: rect.height, ratio: visible / rect.height, viewport: innerHeight }
})

// Lets the reveal start, then waits for every staggered transition before reading paint.
const paintedOpacities = (group: Locator) => group.evaluate(async element => {
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    resolve()
  })))
  await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished))
  return [...element.children].map(child => getComputedStyle(child).opacity)
})

const expectPainted = async (group: Locator) => {
  await expect(group, 'Viewport entry must reveal the group below the default ratio').toHaveClass(/\bis-revealed\b/u)
  const opacities = await paintedOpacities(group)

  expect(opacities.length).toBeGreaterThan(0)
  expect(opacities.filter(opacity => opacity !== '1'), 'Every card must be painted, not just have a box').toEqual([])
}

test.describe('Reveal groups on viewport entry', () => {
  test.use({ reducedMotion: 'no-preference' })

  test.describe('at 390px and 200% text', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('a group too tall to reach the default ratio reveals after a jump to its last card', async ({ page, browserName }) => {
      await openWithTextSize(page, '/portfolio/', 200)
      const group = await pendingProjectsGroup(page)
      const { height, viewport } = await visibleShare(group)

      expect(height, 'The group must be unable to reach the default ratio in this viewport')
        .toBeGreaterThan(viewport / defaultThreshold)

      const card = group.locator('[data-portfolio-project]').last()

      await card.scrollIntoViewIfNeeded()
      await expectPainted(group)

      const title = card.getByRole('heading').getByRole('link')
      const caseStudy = card.getByRole('link', { name: /^Read case study/u })

      await title.focus()
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
      await expect(caseStudy).toBeFocused()
      const hidden = await caseStudy.evaluate(element => {
        const ancestors: string[] = []

        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node)
          const transparent = Number(style.opacity) === 0 || style.visibility !== 'visible'

          if (transparent || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true') {
            ancestors.push(node.tagName.toLowerCase())
          }
        }
        return ancestors
      })

      expect(hidden, 'The focused link must not sit inside a transparent or hidden ancestor').toEqual([])
    })
  })

  test.describe('at 1440px and 100% text', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('a group reveals when only a sliver enters the viewport', async ({ page }) => {
      await openWithTextSize(page, '/portfolio/', 100)
      const group = await pendingProjectsGroup(page)

      await group.evaluate(element => {
        const top = element.getBoundingClientRect().top + scrollY

        scrollTo({ top: top - innerHeight + 48, behavior: 'instant' })
      })
      await expectPainted(group)

      const { ratio } = await visibleShare(group)

      expect(ratio, 'Only a sliver may be visible, below the default ratio').toBeGreaterThan(0)
      expect(ratio).toBeLessThan(defaultThreshold)
    })
  })
})
