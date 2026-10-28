import { expect, type Locator, test } from '@playwright/test'

import { getTestimonials } from '../src/data/profile'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const locales = [
  { route: '/about/', locale: 'en', lifeLabel: 'Outside work', lifeHeading: 'Life beyond the screen.', travel: '/travel/' },
  { route: '/es/about/', locale: 'es', lifeLabel: 'Fuera del trabajo', lifeHeading: 'La vida fuera de la pantalla.', travel: '/es/travel/' }
] as const
const motionGroups = '[data-about-life-photos], [data-about-testimonials]'
const layouts = [
  { width: 1440, textSize: 100 },
  { width: 1024, textSize: 100 },
  { width: 768, textSize: 100 },
  { width: 390, textSize: 100 },
  { width: 320, textSize: 100 },
  { width: 320, textSize: 200 },
  { width: 390, textSize: 200 },
  { width: 1440, textSize: 200 }
]

const expectPainted = async (group: Locator) => {
  await expect.poll(() => group.evaluate(element => [...element.children].every(child => (
    getComputedStyle(child).opacity === '1'
  )))).toBe(true)
}

for (const { route, locale, lifeLabel, lifeHeading, travel } of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`About personal chapters keep photos, full quotes and links readable in ${locale}, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await page.goto(route)
      const portrait = page.locator('[data-about-hero-portrait] img')
      const life = page.locator('#about-life')

      await expect(life.getByRole('heading', { level: 2 })).toHaveText(lifeHeading)
      await expect(page.locator('#about-guide').getByRole('link', { name: lifeLabel, exact: true })).toHaveAttribute('href', '#about-life')
      await expect(life.getByRole('link')).toHaveAttribute('href', travel)
      const photographs = page.locator('[data-about-hero-portrait] img, #about-life img')

      await expect(photographs).toHaveCount(3)
      for (const photograph of await photographs.all()) {
        await expect(photograph).not.toHaveAttribute('alt', '')
        await photograph.scrollIntoViewIfNeeded()
        await expect.poll(() => photograph.evaluate(image => (
          image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
        ))).toBe(true)
      }

      await expect(portrait).toHaveAttribute('src', /^\//u)
      const heroSource = await portrait.evaluate((image: HTMLImageElement) => new URL(image.src).pathname)

      await expect(page.locator('head link[rel="preload"][as="image"]')).toHaveAttribute('href', heroSource)
      const profileSchemas = await page.locator('script[type="application/ld+json"]').allTextContents()

      expect(profileSchemas.find(schema => schema.includes('"@type":"ProfilePage"'))).toContain(heroSource)
      const recommendations = page.locator('#about-recommendations [data-testimonial]')
      const expected = getTestimonials(locale)

      await expect(recommendations).toHaveCount(expected.length)
      for (const [index, testimonial] of expected.entries()) {
        const article = recommendations.nth(index)

        await expect(article.locator('blockquote')).toHaveAttribute('lang', 'en')
        await expect(article.locator('blockquote')).toHaveText(`“${testimonial.quote}”`)
        await expect(article.locator('[data-testimonial-author]')).toHaveText(testimonial.name)
        await expect(article.locator('[data-testimonial-role]')).toHaveText(testimonial.role)
        await expect(article.locator('[data-testimonial-relationship]')).toHaveText(testimonial.relationship)
      }

      for (const { width, textSize } of layouts) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async size => {
          document.documentElement.style.fontSize = `${size}%`
          await document.fonts.ready
        }, textSize)
        const clipped = await page.locator('[data-about-hero], #about-life, #about-recommendations').evaluateAll(sections => sections.flatMap(section => {
          const bounds = section.getBoundingClientRect()

          return [...section.querySelectorAll('h1, h2, p, figcaption, a')].filter(element => {
            const range = document.createRange()

            range.selectNodeContents(element)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(element => element.textContent)
        }))

        const splitWords = await page.locator('[data-about-hero-heading]').evaluate(heading => {
          const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
          const broken: string[] = []
          let node = walker.nextNode()

          while (node) {
            for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
              const range = document.createRange()

              range.setStart(node, match.index)
              range.setEnd(node, match.index + match[0].length)
              if (new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size > 1) broken.push(match[0])
            }
            node = walker.nextNode()
          }
          return broken
        })

        expect(splitWords, `Hero words stay whole at ${width}px, ${textSize}%`).toEqual([])
        expect(clipped, `${width}px, ${textSize}%`).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
      await expectNoUnexpectedAccessibilityViolations(page)
      await life.getByRole('link').focus()
      await expect(life.getByRole('link')).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(travel)
    })
  }
}

for (const { width, textSize } of [{ width: 1440, textSize: 100 }, { width: 390, textSize: 200 }]) {
  test(`About entrances reveal every child at ${width}px and ${textSize}% text`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/about/')
    await page.evaluate(size => {
      document.documentElement.style.fontSize = `${size}%`
    }, textSize)
    const groups = page.locator(motionGroups)

    await expect(groups).toHaveCount(2)
    for (const group of await groups.all()) {
      await expect(group).toHaveAttribute('data-ui-scroll-reveal-bound', 'true')
      await expect(group.locator(':scope > *').first()).toHaveCSS('opacity', '0')
      await group.locator(':scope > *').last().scrollIntoViewIfNeeded()
      await expectPainted(group)
    }
  })
}

test('turning on reduced motion reveals all pending About content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/about/')
  const groups = page.locator(motionGroups)

  await expect(groups.first().locator(':scope > *').first()).toHaveCSS('opacity', '0')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const group of await groups.all()) {
    await expectPainted(group)
    await expect(group.locator(':scope > *').first()).toHaveCSS('transform', 'none')
  }
})

test.describe('About personal chapter without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  for (const { route, locale, lifeLabel, travel } of locales) {
    test(`keeps complete quotes and native photo-chapter navigation in ${locale}`, async ({ page }) => {
      await page.goto(route)
      for (const group of await page.locator(motionGroups).all()) await expectPainted(group)
      await expect(page.locator('#about-recommendations blockquote')).toHaveText(getTestimonials(locale).map(({ quote }) => `“${quote}”`))
      await page.locator('#about-guide').getByRole('link', { name: lifeLabel, exact: true }).focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(`${route}#about-life`)
      await expect(page.locator('#about-life-heading')).toBeInViewport()
      await page.locator('#about-life').getByRole('link').focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(travel)
    })
  }
})
