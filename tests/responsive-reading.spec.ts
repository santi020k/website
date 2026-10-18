import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const LONG_ARTICLE = '/blog/run-repo-on-mac-with-silo-dxmt/'
const LONG_TITLE_ARTICLE = '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/'

// Apply the user's text-size preference before first layout. Changing rem units
// mid-render can leave offscreen geometry stale when native focus scrolls it.
const openWithEnlargedText = async (page: Page, route: string) => {
  await page.addInitScript(() => {
    const applyPreference = () => {
      const root = document.querySelector('html')

      if (!root) return false

      root.style.fontSize = '200%'

      return true
    }

    if (!applyPreference()) {
      const observer = new MutationObserver(() => {
        if (applyPreference()) observer.disconnect()
      })

      observer.observe(document, { childList: true })
    }
  })
  await page.goto(route)
  await expect(page.locator('html')).toHaveCSS('font-size', '32px')
}

const settleLayout = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].filter(image => image.loading === 'eager').map(image => image.decode()))
    // Rem-based container queries can settle after the font-size change's first
    // paint. Read layout until it stabilizes before asking native focus to scroll.
    await new Promise<void>((resolve, reject) => {
      let previousHeight = -1
      let stableFrames = 0
      let frames = 0

      const sample = () => {
        const height = document.documentElement.getBoundingClientRect().height

        stableFrames = height === previousHeight ? stableFrames + 1 : 0
        previousHeight = height
        frames += 1

        if (stableFrames >= 3) {
          resolve()
        } else if (frames >= 30) {
          reject(new Error('Responsive layout did not settle'))
        } else {
          requestAnimationFrame(sample)
        }
      }

      requestAnimationFrame(sample)
    })
  })
}

const expectWithinScreen = async (locator: Locator) => {
  const outside = await locator.evaluateAll(elements => elements.flatMap(element => {
    const bounds = element.getBoundingClientRect()

    return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1) ?
      [{ text: element.textContent.trim(), left: bounds.left, right: bounds.right }] :
      []
  }))

  expect(outside).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Responsive reading in ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('the phone homepage hero reflows enlarged copy and project links', async ({ page }) => {
      await openWithEnlargedText(page, '/')

      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)
        await expectWithinScreen(page.locator('[data-home-hero] h1, [data-home-hero] p, [data-home-hero] a, [data-home-hero] img'))
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/I build products\.\s*And the tools\s*behind them\./u)
        const action = page.getByRole('link', { name: 'Explore my work', exact: true })

        await action.focus()
        await expect(action).toBeInViewport({ ratio: 1 })
      }
    })

    test('history previews and long actions fit narrow screens and enlarged text', async ({ page }) => {
      await page.goto('/history/')

      for (const width of [320, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)
        await expectWithinScreen(page.locator('.history-hero-print'))

        const stackFits = await page.locator('.history-hero-stack').evaluate(element => {
          const stack = element.getBoundingClientRect()
          const exhibit = element.parentElement?.getBoundingClientRect()

          return exhibit !== undefined && stack.width <= exhibit.width + 1
        })

        expect(stackFits).toBe(true)
      }

      await page.setViewportSize({ width: 375, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await settleLayout(page)
      await expectWithinScreen(page.locator('.history-era-actions a'))
      await expectWithinScreen(page.locator('.history-hero-print'))
    })

    test('long cover captions stay inside the image or yield to the page title', async ({ page }) => {
      await page.goto(LONG_TITLE_ARTICLE)
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Configuring MongoDB')
      await expect(page.locator('[data-post-cover-caption]')).toHaveCount(1)

      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => {
          document.documentElement.style.fontSize = size
        }, fontSize)

        for (const width of [320, 375, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await settleLayout(page)

          const caption = page.locator('[data-post-cover-caption]')

          const containedOrHidden = await caption.evaluate(element => {
            const captionBounds = element.getBoundingClientRect()
            const imageBounds = element.parentElement?.querySelector('img')?.getBoundingClientRect()

            return getComputedStyle(element).display === 'none' ||
              (imageBounds !== undefined && captionBounds.top >= imageBounds.top - 1 &&
                captionBounds.bottom <= imageBounds.bottom + 1 && captionBounds.left >= imageBounds.left - 1 &&
                captionBounds.right <= imageBounds.right + 1)
          })

          expect(containedOrHidden).toBe(true)

          await expectWithinScreen(page.getByRole('heading', { level: 1 }))
        }
      }
    })

    for (const { route, fragment, label } of [
      { route: LONG_ARTICLE, fragment: 'troubleshooting-notes', label: 'article' },
      { route: '/portfolio/lumen-ui/', fragment: 'technical-highlights', label: 'project' }
    ]) {
      for (const width of [375, 1440]) {
        test(`${label} fragment navigation clears the header and marks the destination at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 })
          await page.goto(`${route}#${fragment}`)
          await settleLayout(page)

          const expectHeadingClear = async () => {
            await expect.poll(() => page.locator(`#${fragment}`).evaluate(element => {
              const heading = element.getBoundingClientRect()
              const header = document.querySelector('[data-header-shell]')?.getBoundingClientRect()

              return header !== undefined && heading.top >= header.bottom && heading.bottom <= innerHeight
            })).toBe(true)
          }

          await expectHeadingClear()
          const link = page.locator(`[data-toc-tree] a[href="#${fragment}"]`)

          await link.focus()
          await page.keyboard.press('Enter')
          await expectHeadingClear()
          await expect(link).toHaveAttribute('aria-current', 'location')
        })
      }
    }

    test('long desktop navigation exposes the last link and its complete focus outline', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 700 })
      await page.goto(LONG_ARTICLE)
      await settleLayout(page)
      await page.locator('.prose-santi h2').nth(2).scrollIntoViewIfNeeded()
      await page.evaluate(() => {
        scrollBy(0, 300)
      })

      const rail = page.getByRole('complementary', { name: 'Article navigation' })
      const first = rail.locator('[data-toc-tree] a').first()
      const last = rail.locator('[data-toc-tree] a').last()

      await first.focus()
      await page.keyboard.press('Tab')
      await last.focus()
      await expect(last).toBeFocused()
      await expect(last).toBeInViewport({ ratio: 1 })
      await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0)

      const outlineVisible = await last.evaluate(element => {
        const bounds = element.getBoundingClientRect()
        const container = element.closest('aside')?.getBoundingClientRect()
        const style = getComputedStyle(element)
        const outset = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)

        return container !== undefined && style.outlineStyle === 'solid' &&
          bounds.left - outset >= container.left && bounds.right + outset <= container.right &&
          bounds.top - outset >= container.top && bounds.bottom + outset <= container.bottom
      })

      expect(outlineVisible).toBe(true)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/#references$/u)
      await expect(page.getByRole('heading', { name: 'References', exact: true })).toBeInViewport()

      const scan = await new AxeBuilder({ page }).include('[aria-label="Article navigation"]').analyze()

      expect(scan.violations).toEqual([])
    })

    test('project details can be scrolled in a short desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 600 })
      await page.goto('/portfolio/lumen-ui/')
      await settleLayout(page)
      await page.getByRole('heading', { name: 'What Lumen 4 brings together' }).scrollIntoViewIfNeeded()

      const rail = page.getByRole('complementary', { name: 'Project details' })

      await rail.hover()
      await page.mouse.wheel(0, 2000)
      await expect.poll(() => rail.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
      await expect(rail.getByRole('region', { name: 'Outcomes' }).getByRole('listitem').last()).toBeInViewport({ ratio: 1 })
      await expectWithinScreen(rail)
    })

    test('the floating Top control leaves the footer source link clickable', async ({ page }) => {
      await page.goto('/blog/')

      for (const width of [375, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await settleLayout(page)
        await page.evaluate(() => {
          scrollTo(0, document.documentElement.scrollHeight)
        })
        await expect(page.locator('#back-to-top')).toHaveClass(/is-visible/u)

        const source = page.getByRole('link', { name: /Website source/u })

        await source.click({ trial: true })
        const clear = await source.evaluate(element => {
          const link = element.getBoundingClientRect()
          const top = document.querySelector('#back-to-top')?.getBoundingClientRect()

          return top !== undefined && (link.right <= top.left || link.left >= top.right ||
            link.bottom <= top.top || link.top >= top.bottom)
        })

        expect(clear).toBe(true)
      }
    })

    test('technology labels and counts reflow with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 })
      await openWithEnlargedText(page, '/technologies/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-technology-group], [data-technology-item], [data-site-pill]'))
      await page.getByLabel('Find a technology').fill('Developer Experience')

      const result = page.locator('[data-technology-item]:not([hidden]) a')

      await expect(result).toHaveCount(1)
      await expect(result).toContainText('Developer Experience (DX)')
      await result.focus()
      await expect(result).toBeInViewport({ ratio: 1 })
      await expectWithinScreen(result.locator('span'))
      await page.keyboard.press('Enter')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Developer Experience')

      await page.goto('/portfolio/lumen-ui/')
      await expect(page.locator('html')).toHaveCSS('font-size', '32px')
      await settleLayout(page)
      await expectWithinScreen(page.locator('.editorial-detail-hero [data-site-pill], .editorial-detail-hero p'))
    })

    test('resume contacts and PDF actions remain readable with enlarged text', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 })
      await openWithEnlargedText(page, '/resume/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-resume-shell] > div p, [data-resume-shell] > div a'))

      for (const name of ['Download two-page resume PDF', 'Download full CV PDF']) {
        const download = page.getByRole('link', { name })

        await download.focus()
        await expect(download).toBeInViewport({ ratio: 1 })
        await expect(download).toHaveAttribute('download')
      }
    })

    test('speaking resources reflow instead of clipping at tablet widths', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 900 })
      await openWithEnlargedText(page, '/speaking/')
      await settleLayout(page)
      await expectWithinScreen(page.locator('[data-speaking-timeline] a'))

      const watch = page.getByRole('link', { name: 'Watch talk', exact: true }).first()

      await watch.focus()
      await expect(watch).toBeInViewport({ ratio: 1 })
    })

    for (const width of [375, 768, 1440]) {
      test(`header utilities and menu remain usable with enlarged text at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await openWithEnlargedText(page, '/')
        await settleLayout(page)
        await expectWithinScreen(page.locator('[data-header-shell] a, [data-header-shell] button'))

        const menu = page.locator('[data-mobile-nav-toggle]')

        await expect(menu).toBeVisible()
        await menu.focus()
        await page.keyboard.press('Enter')
        await expect(menu).toHaveAttribute('aria-expanded', 'true')
        await expectWithinScreen(page.locator('[data-mobile-nav-panel] a'))
        await page.keyboard.press('Escape')
        await expect(menu).toHaveAttribute('aria-expanded', 'false')
        await expect(menu).toBeFocused()
      })
    }
  })
}
