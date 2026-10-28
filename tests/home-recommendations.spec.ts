import { expect, type Locator, test } from '@playwright/test'

import { getTestimonials } from '../src/data/profile'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const motionGroups = '[data-home-life-photos], [data-home-testimonial-grid]'
const prefixes = { en: '', es: '/es' } as const
const layouts = [
  { width: 1440, textSize: 100, sideBySide: true },
  { width: 1024, textSize: 100, sideBySide: true },
  { width: 768, textSize: 100, sideBySide: false },
  { width: 390, textSize: 100, sideBySide: false },
  { width: 320, textSize: 100, sideBySide: false },
  { width: 390, textSize: 200, sideBySide: false },
  { width: 1440, textSize: 200, sideBySide: false }
] as const

const expectPainted = async (group: Locator) => {
  await expect.poll(() => group.evaluate(element => [...element.children].every(child => (
    getComputedStyle(child).opacity === '1'
  )))).toBe(true)
}

const recommendationLayout = (articles: Locator) => articles.evaluateAll(elements => {
  const rectangles = elements.map(element => element.getBoundingClientRect())
  const [first, second, third] = rectangles

  if (!first || !second || !third) throw new Error('All recommendations must be rendered')
  return {
    sideBySide: second.left > first.right,
    supportingAligned: Math.abs(second.left - third.left) < 1,
    supportingSeparated: third.top > second.bottom,
    leadingFirst: first.top <= second.top,
    overlapping: rectangles.some((rect, index) => rectangles.slice(index + 1).some(other => (
      rect.left < other.right && rect.right > other.left && rect.top < other.bottom && rect.bottom > other.top
    )))
  }
})

for (const locale of ['en', 'es'] as const) {
  const prefix = prefixes[locale]

  for (const theme of ['light', 'dark'] as const) {
    test(`recommendations preserve complete quotes and attribution in ${locale}, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      const expected = getTestimonials(locale).slice(0, 3)

      for (const { width, textSize, sideBySide } of layouts) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`${prefix}/`)
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)

        const section = page.locator('[data-home-testimonials]')
        const articles = section.locator('[data-testimonial]')

        await expect(articles).toHaveCount(expected.length)
        for (const [index, testimonial] of expected.entries()) {
          const article = articles.nth(index)

          await expect(article.locator('blockquote')).toHaveAttribute('lang', 'en')
          await expect(article.locator('blockquote')).toHaveText(`“${testimonial.quote}”`)
          await expect(article.locator('[data-testimonial-author]')).toHaveText(testimonial.name)
          await expect(article.locator('[data-testimonial-role]')).toHaveText(testimonial.role)
          await expect(article.locator('[data-testimonial-relationship]')).toHaveText(testimonial.relationship)
          const clipped = await article.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('p')].some(paragraph => {
              const range = document.createRange()

              range.selectNodeContents(paragraph)
              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
              ))
            })
          })

          expect(clipped, `${testimonial.name}, ${width}px at ${textSize}%`).toBe(false)
        }

        expect(await recommendationLayout(articles)).toEqual({
          sideBySide,
          supportingAligned: true,
          supportingSeparated: true,
          leadingFirst: true,
          overlapping: false
        })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        const link = section.getByRole('link')

        await expect(link).toHaveAttribute('href', `${prefix}/about/#about-recommendations`)
        await link.focus()
        await expect(link).toBeInViewport()
        await expect(link).toHaveCSS('outline-style', 'solid')
      }
      await expectNoUnexpectedAccessibilityViolations(page)
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${prefix}/about/#about-recommendations`)
      await expect(page.locator('[data-testimonial]')).toHaveCount(4)
    })
  }
}

for (const [width, textSize] of [[1440, 100], [390, 200]] as const) {
  test(`home entrances paint all content on viewport entry at ${width}px and ${textSize}%`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.evaluate(async size => {
      document.documentElement.style.fontSize = `${size}%`
      await document.fonts.ready
    }, textSize)

    const groups = page.locator(motionGroups)

    await expect(groups).toHaveCount(2)
    for (const group of await groups.all()) {
      await expect(group).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
      await expect(group).toHaveAttribute('data-ui-reveal-threshold', '0')
      await expect(group.locator(':scope > *').first()).toHaveCSS('opacity', '0')
      await group.locator(':scope > *').last().scrollIntoViewIfNeeded()
      await expect(group).toHaveClass(/\bis-revealed\b/u)
      await expectPainted(group)
    }
  })
}

test('reduced motion paints photos and recommendations before they enter the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const group of await page.locator(motionGroups).all()) {
    await expectPainted(group)
    await expect(group.locator(':scope > *').first()).toHaveCSS('transform', 'none')
    const durations = await group.locator(':scope > *').evaluateAll(elements => elements.flatMap(element => (
      getComputedStyle(element).transitionDuration.split(',').map(duration => Number.parseFloat(duration))
    )))

    // The shared reduced-motion safety net uses an imperceptible 1ms transition.
    expect(Math.max(...durations)).toBeLessThanOrEqual(0.001)
  }
})

test('turning on reduced motion reveals pending homepage content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const groups = page.locator(motionGroups)

  await expect(groups.first().locator(':scope > *').first()).toHaveCSS('opacity', '0')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const group of await groups.all()) await expectPainted(group)
})

test.describe('homepage recommendations without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  for (const locale of ['en', 'es'] as const) {
    const prefix = prefixes[locale]

    test(`all recommendations and personal photos are visible in ${locale}`, async ({ page }) => {
      await page.goto(`${prefix}/`)
      for (const group of await page.locator(motionGroups).all()) await expectPainted(group)
      const quotes = page.locator('[data-home-testimonials] blockquote')

      await expect(quotes).toHaveText(getTestimonials(locale).slice(0, 3).map(({ quote }) => `“${quote}”`))
      await page.locator('[data-home-testimonials]').getByRole('link').click()
      await expect(page).toHaveURL(`${prefix}/about/#about-recommendations`)
    })
  }
})
