import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

for (const slug of ['lumen-ui', 'postlens', 'smith-commerce']) {
  for (const theme of ['light', 'dark']) {
    test(`${slug} previews keep complete images and captions readable in ${theme}`, async ({ page }) => {
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/portfolio/${slug}/`)
      const previews = page.getByRole('region', { name: 'Inside the product' })
      await expect(previews.locator('[data-product-preview] > figure')).toHaveCount(2)
      await expect(page.getByRole('navigation', { name: 'Table of contents' }).locator('a[href="#inside-the-product"]')).toHaveCount(1)

      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const textSize of ['100%', '200%']) {
          await page.evaluate(value => {
            document.documentElement.style.fontSize = value
          }, textSize)
          for (const figure of await previews.locator('[data-product-preview] > figure').all()) {
            await figure.scrollIntoViewIfNeeded()
            const image = figure.getByRole('img')
            await expect(image).toHaveAttribute('alt', /\S.{20}/u)
            await expect(image).toHaveAttribute('loading', 'lazy')
            await expect(image).toHaveCSS('object-fit', 'contain')
            await expect.poll(() => image.evaluate(element => {
              if (!(element instanceof HTMLImageElement)) return false

              return element.complete && element.naturalWidth > 0
            })).toBe(true)
            await expect(figure.locator(':scope > figcaption')).toBeVisible()
            const bounds = await figure.boundingBox()
            expect(bounds?.x).toBeGreaterThanOrEqual(0)
            expect((bounds?.x ?? width) + (bounds?.width ?? width)).toBeLessThanOrEqual(width)
            const imageBounds = await image.boundingBox()
            const captionBounds = await figure.locator(':scope > figcaption').boundingBox()
            expect(imageBounds).not.toBeNull()
            expect(captionBounds).not.toBeNull()
            expect(captionBounds?.y).toBeGreaterThanOrEqual((imageBounds?.y ?? 0) + (imageBounds?.height ?? 0))
            for (const copy of await figure.locator(':scope > figcaption :is(h4, p)').all()) {
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
  { slug: 'postlens', chapter: 'Building a private visual content studio for iPhone and iPad', nextSection: 'Outcomes', introParagraphs: 2 },
  { slug: 'lumen-ui', chapter: 'A shared language for web and native interfaces', nextSection: 'Outcomes', introParagraphs: 2 }
]) {
  test(`${slug} introduces its gallery within the relevant chapter`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/portfolio/${slug}/#inside-the-product`)
    const gallery = page.getByRole('region', { name: 'Inside the product' })

    await expect(gallery.getByRole('heading', { name: 'Inside the product', level: 3 })).toHaveCount(1)
    expect(await gallery.evaluate(element => {
      let sibling = element.previousElementSibling
      let paragraphs = 0

      while (sibling?.tagName === 'P') {
        paragraphs += 1
        sibling = sibling.previousElementSibling
      }
      if (sibling?.matches('[data-project-context-lead]')) paragraphs += sibling.querySelectorAll(':scope > p').length

      const chapterHeading = sibling?.matches('h2') ? sibling : sibling?.querySelector('h2')

      return {
        chapter: chapterHeading?.textContent,
        chapterTag: chapterHeading?.tagName,
        paragraphs,
        next: element.nextElementSibling?.matches('[data-project-evidence]') ?
          element.nextElementSibling.querySelector('h3')?.textContent :
          element.nextElementSibling?.textContent
      }
    })).toEqual({ chapter, chapterTag: 'H2', paragraphs: introParagraphs, next: nextSection })

    const navigation = page.getByRole('navigation', { name: 'Table of contents' })
    const chapterGroup = navigation.locator('details').filter({ has: page.locator('a[href="#inside-the-product"]') })
    const galleryLink = chapterGroup.locator('a[href="#inside-the-product"]')

    await expect(chapterGroup.locator('summary')).toHaveText(chapter)
    await expect(chapterGroup).toHaveAttribute('open', '')
    const labels = await chapterGroup.getByRole('link').allTextContents()

    expect(labels.indexOf(slug === 'smith-commerce' ? 'F.W. Webb overview' : 'Chapter overview'))
      .toBe(labels.indexOf('Inside the product') - 1)
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
  await expect(previews).toContainText('PostLens 2 workflow previews captured during development')
  await expect(previews).toContainText('Sample photos are AI-generated')
  await expect(previews).toContainText('gallery scores are illustrative')
  await expect(previews).toContainText('appearance may vary from the released app')
})

test.describe('Product previews without client JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  for (const slug of ['lumen-ui', 'postlens', 'smith-commerce']) {
    test(`${slug} retains its screenshots and captions`, async ({ page }) => {
      await page.goto(`/portfolio/${slug}/#product-previews`)
      const previews = page.getByRole('region', { name: 'Inside the product' })
      await expect(previews.getByRole('heading', { level: 3 })).toBeInViewport()
      await expect(previews.locator('[data-product-preview] > figure')).toHaveCount(2)
      for (const figure of await previews.locator('[data-product-preview] > figure').all()) {
        await figure.scrollIntoViewIfNeeded()
        await expect(figure.getByRole('img')).toBeVisible()
        await expect(figure.getByRole('heading', { level: 4 })).toBeVisible()
        await expect(figure.locator('figcaption p')).toBeVisible()
      }
    })
  }
})
