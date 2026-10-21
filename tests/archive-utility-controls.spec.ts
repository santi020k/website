import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const readingPreferences = async (page: Page, scale: number) => {
  await page.addInitScript(value => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.fontSize = `${Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * value / 100}px`
    })
    document.addEventListener('astro:before-swap', event => {
      event.newDocument.documentElement.style.fontSize = document.documentElement.style.fontSize
    })
  }, scale)
}

const openArchive = async (page: Page, route: string) => {
  await page.goto(route)
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    })))
  })
}

// Exercise the device's native pointer rather than desktop mouse emulation on iOS.
const activatePointer = async (page: Page, x: number, y: number, isMobile: boolean) => {
  if (isMobile) {
    await page.touchscreen.tap(x, y)
    return
  }
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    resolve()
  }))))
  await page.mouse.up()
}

const expectTextFits = async (target: Locator) => {
  const clipped = await target.evaluateAll(elements => elements.flatMap(element => {
    const failures: string[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()

    while (node) {
      const parent = node.parentElement
      const text = node.textContent?.trim()

      if (text && parent?.checkVisibility() && !parent.closest('script, style, .sr-only, .ui-sr-only, [hidden]')) {
        const range = document.createRange()

        range.selectNodeContents(node)
        const bounds = element.getBoundingClientRect()

        if ([...range.getClientRects()].some(rect => rect.width > 0 && (
          rect.left < Math.max(0, bounds.left) - 1 || rect.right > Math.min(innerWidth, bounds.right) + 1
        ))) failures.push(text)
      }
      node = walker.nextNode()
    }
    return failures
  }))

  expect(clipped).toEqual([])
}

const expectClickable = async (target: Locator) => {
  await expect.poll(() => target.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return element.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2))
  })).toBe(true)
}

for (const width of [390, 1440]) {
  for (const scale of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test.describe(`Archive utilities ${width}px / ${scale}% / ${theme}`, () => {
        test.use({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme, reducedMotion: 'reduce' })

        test.beforeEach(async ({ page }) => readingPreferences(page, scale))

        for (const era of ['v1', 'v2', 'v3']) {
          test(`${era} notice grows with text and leaves its links reachable`, async ({ page }) => {
            await openArchive(page, `/${era}/${era === 'v1' ? 'portfolio/optic-power' : 'offline'}/`)
            const notice = page.getByRole('complementary', { name: 'Website archive' })

            await expectTextFits(notice)
            await expect.poll(() => notice.evaluate(element => {
              const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
              const font = Number.parseFloat(getComputedStyle(element).fontSize)

              return font / root
            })).toBeCloseTo(0.875, 2)
            await expect.poll(() => notice.evaluate(element => {
              const reserved = Number.parseFloat(getComputedStyle(document.body).paddingBottom)

              return reserved >= element.getBoundingClientRect().height
            })).toBe(true)
            const scan = await new AxeBuilder({ page }).include('.website-archive-banner').analyze()

            expect(scan.violations).toEqual([])
            for (const link of await notice.getByRole('link').all()) {
              await link.focus()
              await expect(link).toBeFocused()
              await expectClickable(link)
              await expect(link).toHaveCSS('outline-style', 'solid')
            }
          })
        }

        for (const era of ['v2', 'v3']) {
          test(`${era} back-to-top clears the notice and returns keyboard focus`, async ({ page }) => {
            await openArchive(page, `/${era}/offline/`)
            const button = page.locator('#back-to-top')

            await expect(button).toHaveAttribute('inert', '')
            await button.evaluate(element => {
              element.focus()
            })
            await expect(button).not.toBeFocused()
            await page.evaluate(() => {
              window.scrollTo({ top: 1000, behavior: 'instant' })
            })
            await expect(button).not.toHaveAttribute('inert')
            await expectClickable(button)
            const gap = await button.evaluate(element => {
              const notice = document.querySelector('.website-archive-banner')

              return notice ? notice.getBoundingClientRect().top - element.getBoundingClientRect().bottom : -1
            })

            expect(gap).toBeGreaterThanOrEqual(8)
            await button.focus()
            await page.keyboard.press('Enter')
            await expect(page.locator('#main')).toBeFocused()
            await expect(button).toHaveAttribute('inert', '')
            await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
          })
        }

        test('v3 footer labels fit their links and remain keyboard reachable', async ({ page }) => {
          await openArchive(page, '/v3/offline/')
          const links = page.locator('footer ul a')

          await expectTextFits(links)
          await expectTextFits(page.locator('footer .section-label'))
          await page.keyboard.press('Tab')
          for (const name of ['LinkedIn', 'WhatsApp', 'Accessibility']) {
            const link = page.locator('footer').getByRole('link', { name, exact: true }).first()

            await link.focus()
            await expect(link).toBeFocused()
            await expectClickable(link)
          }
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        })

        test('v2 contact values keep a readable measure', async ({ page }) => {
          await openArchive(page, '/v2/offline/')
          const email = page.locator('#contact a[href^="mailto:"]').first()
          const lines = await email.evaluate(element => {
            const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)

            return element.getBoundingClientRect().height / lineHeight
          })

          expect(lines).toBeLessThanOrEqual(3.1)
          await expectTextFits(page.locator('#contact'))
          const button = page.getByRole('button', { name: 'Copy email address', exact: true })
          const box = await button.boundingBox()

          expect(box?.width).toBeGreaterThanOrEqual(44)
          expect(box?.height).toBeGreaterThanOrEqual(44)
        })
      })
    }
  }
}

test.describe('Without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  for (const era of ['v1', 'v2', 'v3']) {
    test(`${era} notice remains usable without JavaScript`, async ({ page }) => {
      await page.goto(`/${era}/`)
      const notice = page.getByRole('complementary', { name: 'Website archive' })

      await expect(notice).toHaveCSS('position', 'static')
      await expect(page.locator('html')).not.toHaveAttribute('data-website-archive-ready')
      expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--website-archive-banner-height'))).toBe('')
      await notice.getByRole('link', { name: 'Website history', exact: true }).click()
      await expect(page).toHaveURL(/\/history\/$/u)
    })
  }
})

test('archive notice remeasures after resize and client navigation', async ({ page }) => {
  await readingPreferences(page, 200)
  await page.setViewportSize({ width: 390, height: 844 })
  await openArchive(page, '/v2/offline/')
  const documentStart = await page.evaluate(() => performance.timeOrigin)
  await page.locator('main').getByRole('link', { name: 'Browse projects', exact: true }).click()
  await expect(page).toHaveURL('/v2/portfolio/')
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
  await expect(page.locator('html')).toHaveCSS('font-size', '32px')
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 320 }]) {
    await page.setViewportSize(viewport)
    const notice = page.getByRole('complementary', { name: 'Website archive' })

    await expect.poll(() => notice.evaluate(element => {
      const reserved = Number.parseFloat(getComputedStyle(document.body).paddingBottom)

      return reserved - element.getBoundingClientRect().height
    })).toBeGreaterThanOrEqual(0)
    const box = await notice.boundingBox()

    expect(box?.height).toBeLessThanOrEqual(viewport.height * 0.45 + 1)
    for (const link of await notice.getByRole('link').all()) {
      await link.focus()
      await expectClickable(link)
    }
  }
})

for (const result of ['success', 'denied', 'unavailable'] as const) {
  test(`v2 email copy reports ${result} and keeps keyboard focus`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await readingPreferences(page, 200)
    await page.addInitScript(outcome => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: outcome === 'unavailable' ?
          undefined :
          {
            writeText: (text: string) => {
              sessionStorage.setItem('test-copy-value', text)
              return outcome === 'success' ? Promise.resolve() : Promise.reject(new DOMException('Test denial', 'NotAllowedError'))
            }
          }
      })
    }, result)
    await openArchive(page, '/v2/offline/')
    const button = page.getByRole('button', { name: 'Copy email address', exact: true })

    await button.focus()
    await page.keyboard.press('Enter')
    const status = page.locator('#contact').getByRole('status')

    await expect(status).toHaveText(result === 'success' ? 'Email address copied.' : 'Could not copy. Select the email address to copy it.')
    await expect(button).toBeFocused()
    await expect(button).toHaveAccessibleName('Copy email address')
    await expectTextFits(status)
    const scan = await new AxeBuilder({ page }).include('#contact-copy-status').analyze()

    expect(scan.violations).toEqual([])
  })
}

test('v2 email copying has one handler after repeated client navigation', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => {
          sessionStorage.setItem('test-copy-count', String(Number(sessionStorage.getItem('test-copy-count') ?? 0) + 1))
          return Promise.resolve()
        }
      }
    })
  })
  await openArchive(page, '/v2/offline/')
  const documentStart = await page.evaluate(() => performance.timeOrigin)

  let copies = 0

  for (const destination of ['About', 'Home', 'About']) {
    await page.getByRole('button', { name: 'Copy email address', exact: true }).click()
    await expect(page.locator('#contact').getByRole('status')).toHaveText('Email address copied.')
    copies += 1
    expect(await page.evaluate(() => Number(sessionStorage.getItem('test-copy-count')))).toBe(copies)

    await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: destination, exact: true }).click()
    await expect(page).toHaveURL(destination === 'About' ? '/v2/about/' : '/v2/')
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
    await expect(page.locator('#contact').getByRole('status')).toBeEmpty()
  }
})

test('normal desktop archive layouts retain their columns and contact rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openArchive(page, '/v3/offline/')
  const columns = await page.locator('[data-footer-directory]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)

  expect(columns).toBe(3)
  await openArchive(page, '/v2/offline/')
  for (const row of await page.locator('[data-contact-row]').all()) {
    await expect(row).toHaveCSS('flex-direction', 'row')
  }
})

for (const era of ['v2', 'v3']) {
  test(`${era} scrolling hides the back-to-top control without losing focus`, async ({ page }) => {
    await openArchive(page, `/${era}/offline/`)
    const button = page.locator('#back-to-top')

    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'instant' })
    })
    await expect(button).not.toHaveAttribute('inert')
    await button.focus()
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await expect(page.locator('#main')).toBeFocused()
    await expect(button).toHaveAttribute('inert', '')
  })
}

test('v2 repeating a copy failure updates the live region again', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  })
  await openArchive(page, '/v2/offline/')
  const button = page.getByRole('button', { name: 'Copy email address', exact: true })
  const status = page.locator('#contact').getByRole('status')

  await button.focus()
  await page.keyboard.press('Enter')
  await expect(status).toContainText('Could not copy.')
  await status.evaluate(element => {
    const observer = new MutationObserver(() => {
      if (element.textContent === '') element.setAttribute('data-test-cleared', '')
    })

    observer.observe(element, { childList: true })
  })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(status).toHaveAttribute('data-test-cleared', '')
  await expect(status).toContainText('Could not copy.')
  await expect(button).toBeFocused()
})

test('pointer activation near the fixed header keeps the link reachable', async ({ page, isMobile }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await readingPreferences(page, 200)
  await openArchive(page, '/v3/offline/')
  const link = page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'About', exact: true })

  await link.scrollIntoViewIfNeeded()
  await link.evaluate(element => {
    const header = document.querySelector('header')

    if (!header) throw new Error('Missing archive header')
    window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - header.getBoundingClientRect().bottom + 16, behavior: 'instant' })
  })
  await expectClickable(link)
  const box = await link.evaluate(element => {
    const bounds = element.getBoundingClientRect()

    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
  })
  await activatePointer(page, box.x + box.width / 2, box.y + box.height / 2, isMobile)
  await expect(page).toHaveURL('/v3/about/')
})

for (const era of ['v1', 'v2', 'v3']) {
  test(`${era} focusing the fixed skip link does not scroll the document`, async ({ page }) => {
    await openArchive(page, `/${era}/`)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#main"]').first()).not.toBeFocused()
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'instant' })
    })
    const before = await page.evaluate(() => scrollY)

    await page.locator('a[href="#main"]').first().focus()
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve()
    }))))
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0)
  })
}

for (const width of [390, 1440]) {
  for (const scale of [100, 200]) {
    test(`v1 portfolio tabs wrap and retain keyboard selection at ${width}px / ${scale}%`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await readingPreferences(page, scale)
      await openArchive(page, '/v1/portfolio/')
      const tabs = page.getByRole('tab')
      const project = page.locator('a[href="/v1/portfolio/nebular/"]').first()

      await expectTextFits(project)
      await tabs.first().scrollIntoViewIfNeeded()
      await expectTextFits(tabs)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await tabs.first().focus()
      await page.keyboard.press('ArrowRight')
      await expect(tabs.nth(1)).toBeFocused()
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Home')
      await expect(tabs.first()).toBeFocused()
      await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
    })
  }
}
