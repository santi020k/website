import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const article = '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/'

const setTextSize = async (page: Page, textSize: number) => {
  await page.addInitScript(size => {
    document.addEventListener('astro:before-swap', event => {
      event.newDocument.documentElement.style.fontSize = `${size}%`
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

const finishAnimations = (target: Locator) => target.evaluate(async element => {
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    resolve()
  })))
  await Promise.all(element.getAnimations({ subtree: true })
    .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => undefined)))
})

const expectChoicesVisible = async (tabs: Locator) => {
  const bounds = await tabs.evaluate(element => {
    const list = element.querySelector('[role="tablist"]')

    if (!list) throw new Error('Expected a package manager tablist')
    const rect = list.getBoundingClientRect()

    return {
      left: rect.left,
      right: rect.right,
      overflow: list.scrollWidth - list.clientWidth,
      choices: [...list.querySelectorAll('[role="tab"]')].map(tab => {
        const box = tab.getBoundingClientRect()

        return { left: box.left, right: box.right }
      })
    }
  })

  expect(bounds.overflow).toBeLessThanOrEqual(1)
  expect(bounds.choices).toHaveLength(4)
  for (const choice of bounds.choices) {
    expect(choice.left).toBeGreaterThanOrEqual(bounds.left)
    expect(choice.right).toBeLessThanOrEqual(bounds.right)
  }
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Reading controls ${width}px / ${textSize}% / ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test.beforeEach(async ({ page }) => {
          await setTextSize(page, textSize)
          // Keep third-party widget contents outside this local UI regression.
          await page.route('https://giscus.app/**', route => route.abort())
        })

        test('package choices reflow and preserve keyboard selection, sync, and storage', async ({ page }) => {
          await page.goto(article)
          await page.evaluate(() => document.fonts.ready)
          const groups = page.locator('[data-package-manager-code-tabs]')
          const first = groups.first()
          const second = groups.nth(1)

          await expectChoicesVisible(first)
          await first.getByRole('tab', { name: 'npm', exact: true }).focus()
          await page.keyboard.press('End')
          const bun = first.getByRole('tab', { name: 'Bun', exact: true })

          await expect(bun).toBeFocused()
          await expect(bun).toHaveAttribute('aria-selected', 'true')
          await expect(bun).toHaveCSS('outline-style', 'solid')
          await expect(second.getByRole('tab', { name: 'Bun', exact: true })).toHaveAttribute('aria-selected', 'true')
          await expectChoicesVisible(first)
          await page.keyboard.press('ArrowLeft')
          await expect(first.getByRole('tab', { name: 'pnpm', exact: true })).toBeFocused()
          await page.reload()
          await expect(first.getByRole('tab', { name: 'pnpm', exact: true })).toHaveAttribute('aria-selected', 'true')
          await expectChoicesVisible(first)
          await first.getByRole('tab', { name: 'pnpm', exact: true }).focus()
          await page.keyboard.press('Home')
          await expect(first.getByRole('tab', { name: 'npm', exact: true })).toBeFocused()
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        })

        test('code regions are distinct, readable, and leave space for their copy controls', async ({ page }) => {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', {
              configurable: true,
              value: { writeText: (text: string) => {
                localStorage.setItem('reading-code-copy', text)
                return Promise.resolve()
              } }
            })
          })
          await page.goto(article)
          const groups = page.locator('[data-package-manager-code-tabs]')
          const names = await groups.locator('[role="tabpanel"]:visible pre').evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')))

          expect(names).toHaveLength(2)
          expect(new Set(names).size).toBe(names.length)
          for (const group of await groups.all()) {
            const code = group.locator('[role="tabpanel"]:visible pre')
            const copy = group.locator('[role="tabpanel"]:visible [data-ui-code-copy]')

            await code.focus()
            await expect(code).toBeFocused()
            await expect(code).toHaveCSS('outline-style', 'solid')
            const codeBounds = await code.evaluate(element => element.getBoundingClientRect().right)
            const copyBounds = await copy.evaluate(element => element.getBoundingClientRect().left)

            expect(codeBounds).toBeLessThanOrEqual(copyBounds)
            await copy.focus()
            await expect(copy).toHaveCSS('outline-style', 'solid')
            const focus = await copy.evaluate(element => {
              const figure = element.closest('[data-ui-code]')

              if (!figure) throw new Error('Expected a code figure')
              const box = element.getBoundingClientRect()
              const frame = figure.getBoundingClientRect()
              const style = getComputedStyle(element)
              const outset = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)

              return { right: box.right + outset, bottom: box.bottom + outset, edge: frame.right, floor: frame.bottom }
            })

            expect(focus.right).toBeLessThanOrEqual(focus.edge)
            expect(focus.bottom).toBeLessThanOrEqual(focus.floor)
            await page.keyboard.press('Enter')
            await expect(copy).toHaveAttribute('data-state', 'copied')
            expect(await page.evaluate(() => localStorage.getItem('reading-code-copy'))).toBe(await code.innerText())
          }
          await expectNoUnexpectedAccessibilityViolations(page)
        })

        test('copied confirmation has measurable contrast and restores the idle control', async ({ page }) => {
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } })
          })
          await page.goto(article)
          const button = page.locator('#copy-link-btn')

          await button.focus()
          await page.keyboard.press('Enter')
          await expect(button).toHaveText('Link copied!')
          await expect(button).toBeFocused()
          await finishAnimations(button)
          const scan = await new AxeBuilder({ page }).include('#copy-link-btn').analyze()

          expect(scan.violations).toEqual([])
          expect(scan.incomplete.filter(result => result.id === 'color-contrast')).toEqual([])
          await expect(button).toHaveText('Copy link')
          await expect(button).toBeFocused()
          await expect(button).not.toHaveClass(/copied/u)
        })
      })
    }
  }
}
