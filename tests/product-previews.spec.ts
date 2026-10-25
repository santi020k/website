import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const slug of ['lumen-ui', 'postlens', 'smith-commerce']) {
  for (const theme of ['light', 'dark']) {
    test(`${slug} previews keep complete images and captions readable in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/portfolio/${slug}/`)
      const previews = page.getByRole('region', { name: 'Inside the product' })
      await expect(previews.locator('figure')).toHaveCount(2)
      await expect(page.getByRole('link', { name: 'Inside the product', exact: true })).toHaveAttribute('href', '#inside-the-product')

      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const textSize of ['100%', '200%']) {
          await page.evaluate(value => {
            document.documentElement.style.fontSize = value
          }, textSize)
          for (const figure of await previews.locator('figure').all()) {
            await figure.scrollIntoViewIfNeeded()
            const image = figure.getByRole('img')
            await expect(image).toHaveAttribute('alt', /\S.{20}/u)
            await expect(image).toHaveAttribute('loading', 'lazy')
            await expect(image).toHaveCSS('object-fit', 'contain')
            await expect.poll(() => image.evaluate(element => {
              if (!(element instanceof HTMLImageElement)) return false

              return element.complete && element.naturalWidth > 0
            })).toBe(true)
            await expect(figure.locator('figcaption')).toBeVisible()
            const bounds = await figure.boundingBox()
            expect(bounds?.x).toBeGreaterThanOrEqual(0)
            expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
            const imageBounds = await image.boundingBox()
            const captionBounds = await figure.locator('figcaption').boundingBox()
            expect(imageBounds).not.toBeNull()
            expect(captionBounds).not.toBeNull()
            expect(captionBounds?.y).toBeGreaterThanOrEqual((imageBounds?.y ?? 0) + (imageBounds?.height ?? 0))
            for (const copy of await figure.locator('h4, p').all()) {
              const content = await copy.evaluate(element => ({
                width: element.clientWidth,
                contentWidth: element.scrollWidth,
                height: element.clientHeight,
                contentHeight: element.scrollHeight
              }))
              expect(content.contentWidth).toBeLessThanOrEqual(content.width + 1)
              expect(content.contentHeight).toBeLessThanOrEqual(content.height + 1)
            }
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        }
      }

      await expectNoUnexpectedAccessibilityViolations(page)
    })
  }
}

for (const { slug, chapter, nextSection, introParagraphs } of [
  { slug: 'smith-commerce', chapter: 'F.W. Webb: building the purchasing experience', nextSection: 'The purchasing challenge', introParagraphs: 1 },
  { slug: 'postlens', chapter: 'Building a private visual content studio for iPhone and iPad', nextSection: 'Goals', introParagraphs: 2 },
  { slug: 'lumen-ui', chapter: 'A shared language for web and native interfaces', nextSection: 'Goals', introParagraphs: 2 }
]) {
  test(`${slug} introduces its gallery within the relevant chapter`, async ({ page }) => {
    await page.goto(`/portfolio/${slug}/`)
    const gallery = page.getByRole('region', { name: 'Inside the product' })

    await expect(gallery.getByRole('heading', { name: 'Inside the product', level: 3 })).toHaveCount(1)
    expect(await gallery.evaluate(element => {
      let sibling = element.previousElementSibling
      let paragraphs = 0

      while (sibling?.tagName === 'P') {
        paragraphs += 1
        sibling = sibling.previousElementSibling
      }

      return {
        chapter: sibling?.textContent,
        chapterTag: sibling?.tagName,
        paragraphs,
        next: element.nextElementSibling?.matches('[data-project-evidence]') ?
          element.nextElementSibling.querySelector('h3')?.textContent :
          element.nextElementSibling?.textContent
      }
    })).toEqual({ chapter, chapterTag: 'H2', paragraphs: introParagraphs, next: slug === 'smith-commerce' ? nextSection : 'Outcomes' })

    const navigation = page.getByRole('navigation', { name: 'Table of contents' })
    const galleryLink = navigation.getByRole('link', { name: 'Inside the product', exact: true })

    await expect(galleryLink).toHaveAttribute('data-depth', '3')
    const labels = await navigation.getByRole('link').allTextContents()

    expect(labels.indexOf(chapter)).toBe(labels.indexOf('Inside the product') - 1)
    expect(labels.indexOf(nextSection)).toBe(labels.indexOf('Inside the product') + 1)
    await galleryLink.click()
    await expect(page.locator('#inside-the-product')).toBeInViewport()
    await expect(galleryLink).toHaveAttribute('aria-current', 'location')
  })
}

test('projects without previews keep their existing reading navigation', async ({ page }) => {
  await page.goto('/portfolio/datagran/')
  await expect(page.locator('[data-product-previews]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Inside the product', exact: true })).toHaveCount(0)
})

test('Smith identifies Webb screenshots as development previews', async ({ page }) => {
  await page.goto('/portfolio/smith-commerce/')
  const previews = page.getByRole('region', { name: 'Inside the product' })
  await expect(previews).toContainText('F.W. Webb development preview')
  await expect(previews).toContainText('signed-out session')
  await expect(previews).toContainText('The design and content are still evolving.')
})

test('PostLens distinguishes development screens and generated samples from the store release', async ({ page }) => {
  await page.goto('/portfolio/postlens/')
  const previews = page.getByRole('region', { name: 'Inside the product' })
  await expect(previews).toContainText('PostLens 2.0 development captures')
  await expect(previews).toContainText('AI-generated sample photos')
  await expect(previews).toContainText('illustrative gallery scores')
  await expect(previews).toContainText('not the current App Store UI')
})

test.describe('Product previews without client JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  for (const slug of ['lumen-ui', 'postlens', 'smith-commerce']) {
    test(`${slug} retains its screenshots and captions`, async ({ page }) => {
      await page.goto(`/portfolio/${slug}/#product-previews`)
      const previews = page.getByRole('region', { name: 'Inside the product' })
      await expect(previews.getByRole('heading', { level: 3 })).toBeInViewport()
      await expect(previews.locator('figure')).toHaveCount(2)
      for (const figure of await previews.locator('figure').all()) {
        await figure.scrollIntoViewIfNeeded()
        await expect(figure.getByRole('img')).toBeVisible()
        await expect(figure.getByRole('heading', { level: 4 })).toBeVisible()
        await expect(figure.locator('figcaption p')).toBeVisible()
      }
    })
  }
})
