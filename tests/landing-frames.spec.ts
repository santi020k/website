import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

const routes = ['/about/', '/work/', '/projects/', '/blog/']
const viewports = [
  { width: 320, fontSize: 16 },
  { width: 375, fontSize: 16 },
  { width: 768, fontSize: 16 },
  { width: 1440, fontSize: 16 },
  { width: 320, fontSize: 20 },
  { width: 768, fontSize: 20 }
]

for (const route of routes) {
  for (const theme of ['light', 'dark']) {
    for (const { width, fontSize } of viewports) {
      const prepareFrame = async (page: Page) => {
        await page.setViewportSize({ width, height: 900 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(value => {
          localStorage.setItem('theme', value)
        }, theme)
        await page.goto(route)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}px`
          await document.fonts.ready
          await new Promise<void>(resolve => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              resolve()
            }))
          })
        }, fontSize)

        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-header-frame', '')

        const geometry = await page.locator('.signature-frame').evaluate(frame => {
          const header = document.querySelector('[data-header-shell]')
          const heading = frame.querySelector('h1')
          const portrait = frame.querySelector('[data-about-hero-portrait]')

          if (!header || !heading) throw new Error('Missing landing header or heading')

          const bounds = (element: Element) => {
            const { bottom, height, left, right, top } = element.getBoundingClientRect()

            return { bottom, height, left, right, top }
          }

          return {
            header: bounds(header),
            frame: bounds(frame),
            heading: bounds(heading),
            portrait: portrait ? bounds(portrait) : null,
            overflows: frame.scrollWidth > frame.clientWidth || heading.scrollWidth > heading.clientWidth,
            controls: [...frame.querySelectorAll('a, button')].map(bounds)
          }
        })

        return geometry
      }

      test(`${route} joins its hero at ${width}px with ${fontSize}px text in ${theme}`, async ({ page }) => {
        const geometry = await prepareFrame(page)

        expect(Math.abs(geometry.header.bottom - geometry.frame.top)).toBeLessThanOrEqual(1)
        expect(geometry.frame.left).toBe(geometry.header.left)
        expect(geometry.frame.right).toBe(geometry.header.right)
        expect(geometry.overflows).toBe(false)

        for (const control of geometry.controls) {
          expect(control.left).toBeGreaterThanOrEqual(geometry.frame.left)
          expect(control.right).toBeLessThanOrEqual(geometry.frame.right)
          expect(control.height).toBeGreaterThanOrEqual(44)
        }
      })

      if (route === '/about/' && width <= 768) {
        test(`about portrait stacks at ${width}px with ${fontSize}px text in ${theme}`, async ({ page }) => {
          const geometry = await prepareFrame(page)
          expect(geometry.portrait?.top).toBeGreaterThan(geometry.heading.bottom)
        })
      }

      if (width === 375) {
        test(`${route} frame is accessible in ${theme}`, async ({ page }) => {
          await prepareFrame(page)
          expect((await new AxeBuilder({ page }).include('.signature-frame').analyze()).violations).toEqual([])
        })
      }
    }
  }
}

for (const width of [375, 1440]) {
  test(`page transitions restore the frame and scrolled dock at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/about/')
    await page.getByRole('main').getByRole('link', { name: 'View resume', exact: true }).click()
    await expect(page).toHaveURL('/resume/')
    await expect(page.locator('[data-header-shell]')).not.toHaveAttribute('data-header-frame')
    await expect(page.locator('.signature-frame')).toHaveCount(0)
    await page.goBack()
    await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-header-frame', '')
    await page.evaluate(() => {
      window.scrollTo(0, 500)
    })
    await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'true')
    expect(await page.locator('[data-header-shell]').evaluate(el => getComputedStyle(el, '::before').opacity)).toBe('1')
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await expect(page.locator('[data-header-shell]')).toHaveAttribute('data-scrolled', 'false')
    expect(await page.locator('[data-header-shell]').evaluate(el => getComputedStyle(el, '::before').opacity)).toBe('0')
  })
}

for (const route of ['/travel/', '/blog/2/', '/blog/tags/', '/resume/', '/privacy/']) {
  test(`${route} keeps the quieter dock`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('[data-header-shell]')).not.toHaveAttribute('data-header-frame')
    await expect(page.locator('.signature-frame')).toHaveCount(0)
  })
}
