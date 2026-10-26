import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

const sectionRoutes = [
  '/projects/',
  '/portfolio/',
  '/speaking/',
  '/developer-experience/',
  '/technologies/',
  '/technologies/react-js/',
  '/technologies/3rd-party-apis/',
  '/blog/',
  '/blog/2/',
  '/blog/tags/developer-experience/',
  '/blog/tags/developer-experience/2/',
  '/blog/series/',
  '/blog/series/building-a-production-nextjs-app/'
]

for (const theme of ['light', 'dark'] as const) {
  test(`mobile profile statistics keep the figure beside readable copy in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    for (const route of ['/work/', '/about/']) {
      await page.setViewportSize({ width: 390, height: 1000 })
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const stats = page.locator('#career-at-a-glance, #about-profile-highlights')

      await expect(stats.locator('article')).toHaveCount(route === '/work/' ? 4 : 3)
      for (const stat of await stats.locator('article').all()) {
        const figure = requireValue(await stat.locator(':scope > p').boundingBox())
        const copy = requireValue(await stat.locator(':scope > div').boundingBox())

        expect(copy.x).toBeGreaterThan(figure.x + figure.width)
        expect(copy.y).toBeCloseTo(figure.y, 0)
      }
      for (const { width, size } of [{ width: 320, size: 100 }, { width: 390, size: 200 }]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        for (const stat of await stats.locator('article').all()) {
          const row = requireValue(await stat.boundingBox())
          const figure = requireValue(await stat.locator(':scope > p').boundingBox())
          const copy = requireValue(await stat.locator(':scope > div').boundingBox())

          expect(copy.y).toBeGreaterThan(figure.y + figure.height)
          expect(copy.width).toBeCloseTo(row.width, 0)
          expect(copy.y + copy.height).toBeLessThanOrEqual(row.y + row.height + 0.5)
          expect(await stat.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
  })
}

test('reading introductions use one responsive interval after the hero', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const route of ['/portfolio/smith-commerce/', '/blog/why-developer-experience-work-should-be-measured-like-product-work/']) {
    await page.goto(route)
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const opening = requireValue(await page.locator('[data-project-opening], [data-article-opening]').boundingBox())
        // The body starts with the mobile contents opener or the current reading
        // introduction; articles and context-led projects no longer use notes headers.
        const firstContent = page.locator('[data-reading-body] > div:first-child > :visible').first()
        const content = requireValue(await firstContent.boundingBox())
        const interval = (content.y - opening.y - opening.height) / (size / 100 * 16)

        // One 3–5rem interval; parent gaps or extra prose insets must not accumulate.
        expect(interval, `${route}, ${width}px, ${size}%`).toBeGreaterThanOrEqual(3 - 0.01)
        expect(interval, `${route}, ${width}px, ${size}%`).toBeLessThanOrEqual(5 + 0.01)
      }
    }
  }
})

for (const width of [390, 768, 1440]) {
  test(`section introductions keep one spacing interval at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const route of sectionRoutes) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      const spacing = await page.locator('main > .page-section-space').evaluateAll(sections => sections.flatMap(section => {
        const previous = section.previousElementSibling
        const content = section.firstElementChild

        if (!previous || !content) return []
        const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        const expected = Number.parseFloat(getComputedStyle(section).getPropertyValue('--section-space')) * rem

        return [{ actual: content.getBoundingClientRect().top - previous.getBoundingClientRect().bottom, expected }]
      }))

      expect(spacing.length, route).toBeGreaterThan(0)
      for (const interval of spacing) expect(interval.actual, route).toBeCloseTo(interval.expected, 0)
    }
  })
}

test('field guides keep the title and description wide and their fragment clears the navbar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/developer-experience/')
  await page.getByRole('link', { name: 'Read the field guides', exact: true }).click()
  const heading = page.locator('#field-guides')

  await expect(heading).toBeInViewport({ ratio: 1 })
  const bounds = requireValue(await heading.boundingBox())
  const title = requireValue(await heading.getByRole('heading').boundingBox())
  const description = requireValue(await heading.locator('.section-copy').boundingBox())
  const action = requireValue(await heading.getByRole('link').boundingBox())
  const nav = requireValue(await page.locator('header').first().boundingBox())

  expect(title.width).toBeGreaterThan(bounds.width * 0.45)
  expect(description.width).toBeGreaterThan(bounds.width * 0.45)
  expect(action.y).toBeGreaterThanOrEqual(description.y + description.height)
  expect(action.x).toBeCloseTo(description.x, 0)
  // Native fragment scrolling rounds the offset to a physical pixel.
  expect(bounds.y).toBeGreaterThanOrEqual(nav.y + nav.height - 0.5)
})

for (const theme of ['light', 'dark'] as const) {
  test(`recovery pages preserve clear actions and readable cards in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
    for (const route of ['/404/', '/offline/']) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        for (const size of [100, 200]) {
          await page.setViewportSize({ width, height: 1000 })
          await page.goto(route)
          await page.evaluate(async textSize => {
            document.documentElement.style.fontSize = `${textSize}%`
            await document.fonts.ready
          }, size)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          const card = page.locator('[data-recovery-card], [data-offline-folio]')

          await expect(card).toBeVisible()
          const illustrationFits = await page.locator('[data-recovery-orbit]').evaluateAll(illustrations => illustrations.every(illustration => {
            const status = illustration.parentElement
            const bounds = illustration.getBoundingClientRect()

            return status !== null && bounds.right <= status.getBoundingClientRect().right + 0.5
          }))

          expect(illustrationFits, `${route} at ${width}px and ${size}% text`).toBe(true)
          for (const link of await page.locator('main a, main button').all()) {
            await link.focus()
            const bounds = requireValue(await link.boundingBox())
            const state = `${route} at ${width}px and ${size}% text`

            // Browsers scroll in whole pixels while line boxes retain fractional pixels.
            expect(bounds.x, state).toBeGreaterThanOrEqual(-0.5)
            expect(bounds.x + bounds.width, state).toBeLessThanOrEqual(width + 0.5)
            expect(bounds.y, state).toBeGreaterThanOrEqual(-0.5)
            expect(bounds.y + bounds.height, state).toBeLessThanOrEqual(1000.5)
          }
        }
      }
      await expectNoUnexpectedAccessibilityViolations(page)
    }
  })
}

test('offline support shares the desktop introduction and stacks beneath it on mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/offline/')
  await page.setViewportSize({ width: 1440, height: 1000 })
  const intro = page.locator('[data-offline-layout] .editorial-page-hero')
  const support = page.locator('[data-offline-support]')
  const desktopIntro = requireValue(await intro.boundingBox())
  const desktopSupport = requireValue(await support.boundingBox())

  expect(desktopSupport.x).toBeGreaterThan(desktopIntro.x + desktopIntro.width)
  expect(desktopSupport.y).toBeLessThan(desktopIntro.y + desktopIntro.height)
  await page.setViewportSize({ width: 390, height: 1000 })
  const mobileIntro = requireValue(await intro.boundingBox())
  const mobileSupport = requireValue(await support.boundingBox())

  expect(mobileSupport.y).toBeGreaterThan(mobileIntro.y + mobileIntro.height)
  expect(mobileSupport.x).toBeCloseTo(mobileIntro.x, 0)
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeEnabled()
})
