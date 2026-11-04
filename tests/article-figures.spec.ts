import { expect, test } from '@playwright/test'

const articles = [
  {
    slug: 'migrate-eslint-8-or-less-to-eslint-9',
    captions: ['From layers to flat config.', 'A clearer path to flat config.']
  },
  {
    slug: 'storybook-in-action-with-next-js-tailwind-and-typescript',
    captions: ['One component. Every variation.']
  },
  {
    slug: 'atomic-module-component-structure-for-react',
    captions: ['A component, kept together.']
  }
]

test.describe('article illustrations', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  for (const { slug, captions } of articles) {
    test(`renders accessible Caption spread figures without scripts on ${slug}`, async ({ page }) => {
      await page.goto(`/blog/${slug}/`)
      const figures = page.locator('figure[data-article-figure]')
      await expect(figures).toHaveCount(captions.length)

      for (const [index, caption] of captions.entries()) {
        const figure = figures.nth(index)
        await expect(figure.getByText(caption, { exact: true })).toBeVisible()
        await expect(figure.locator('[data-figure-label]')).toHaveText(`Figure ${index + 1}`)
        await expect(figure.locator('[data-figure-number]')).toHaveText(String(index + 1).padStart(2, '0'))
        await expect(figure.locator('[data-figure-number]')).toHaveAttribute('aria-hidden', 'true')
        await expect(figure.locator('img')).toHaveAttribute('alt', /\S/u)
        await expect(figure.locator('img')).toHaveAttribute('loading', 'lazy')
        await expect(figure.locator('img')).not.toHaveAttribute('title')
      }

      await page.setViewportSize({ width: 320, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })

      for (const figure of await figures.all()) {
        await figure.scrollIntoViewIfNeeded()
        await expect.poll(() => figure.locator('img').evaluate(image => (
          image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
        ))).toBe(true)
        const layout = await figure.evaluate(element => {
          const image = element.querySelector('img')
          const caption = element.querySelector('figcaption')
          if (!image || !caption) throw new TypeError('Expected an illustrated figure with a caption')
          const imageBounds = image.getBoundingClientRect()
          return {
            loaded: image.naturalWidth > 0,
            renderedRatio: imageBounds.width / imageBounds.height,
            declaredRatio: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
            captionBelowArtwork: caption.getBoundingClientRect().top >= imageBounds.bottom - 1,
            fits: element.scrollWidth <= element.clientWidth + 1 &&
              document.documentElement.scrollWidth <= innerWidth + 1
          }
        })
        expect(layout.loaded).toBe(true)
        expect(layout.renderedRatio).toBeCloseTo(layout.declaredRatio, 2)
        expect(layout.captionBelowArtwork).toBe(true)
        expect(layout.fits).toBe(true)
      }
    })
  }
})
