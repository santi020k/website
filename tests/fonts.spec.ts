import { expect, test } from '@playwright/test'

const normalFont = '/fonts/montserrat-variable-font-wght'
const italicFont = '/fonts/montserrat-italic-variable-font-wght'
const normalSubset = /\/_astro\/montserrat-variable-font-wght\.latin\.[\w-]+\.woff2$/u
const italicSubset = /\/_astro\/montserrat-italic-variable-font-wght\.latin\.[\w-]+\.woff2$/u
const latinSample = 'Santiago — Bogotá, Asunción, São Paulo. Résumé, naïve. ß œ € £ © 2026 ≥ 90'

for (const width of [375, 1440]) {
  for (const route of ['/', '/travel/', '/blog/2/', '/blog/tags/', '/history/', '/blog/astro-and-alpine-patterns-for-fast-content-heavy-sites/', '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/']) {
    test(`Latin font delivery on ${route} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(route)
      const docHeight = await page.evaluate(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight)
        window.scrollTo(0, 0)
        await document.fonts.ready

        return document.documentElement.scrollHeight
      })
      await page.screenshot({
        path: testInfo.outputPath('font-layout.png'),
        fullPage: true,
        scale: 'css',
        clip: { x: 0, y: 0, width, height: Math.min(docHeight, 8192) }
      })

      const fontRequests = await page.evaluate(() => performance.getEntriesByType('resource')
        .map(entry => new URL(entry.name).pathname)
        .filter(path => path.endsWith('.woff2')))

      expect(fontRequests).toContainEqual(expect.stringMatching(normalSubset))
      expect(fontRequests).not.toContain(`${normalFont}.woff2`)
      expect(fontRequests).not.toContain(`${italicFont}.woff2`)
      await expect(page.locator('link[rel="preload"][as="font"]')).toHaveAttribute('href', normalSubset)
    })
  }
}

test('italic text and decomposed accents use the small font; other scripts load the full face', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async text => {
    const sample = document.createElement('p')

    sample.style.font = 'italic 600 24px Montserrat'
    sample.textContent = text.normalize('NFD')
    document.body.append(sample)
    sample.getBoundingClientRect()
    await document.fonts.ready
  }, latinSample)

  const loadedFonts = () => page.evaluate(() => performance.getEntriesByType('resource')
    .map(entry => new URL(entry.name).pathname)
    .filter(path => path.endsWith('.woff2')))

  await expect.poll(loadedFonts).toContainEqual(expect.stringMatching(italicSubset))
  expect(await loadedFonts()).not.toContain(`${italicFont}.woff2`)
  expect(await loadedFonts()).not.toContain(`${normalFont}.woff2`)

  await page.evaluate(async () => {
    for (const style of ['normal', 'italic']) {
      const sample = document.createElement('p')

      sample.style.font = `${style} 600 24px Montserrat`
      sample.textContent = 'Ж'
      document.body.append(sample)
      sample.getBoundingClientRect()
    }

    await document.fonts.ready
  })

  await expect.poll(loadedFonts).toContain(`${normalFont}.woff2`)
  await expect.poll(loadedFonts).toContain(`${italicFont}.woff2`)
})

test('search navigation arrows stay within the small font download', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-site-search-trigger]').click()
  await expect(page.locator('#site-search-input')).toBeFocused()
  await page.evaluate(() => document.fonts.ready)

  const fonts = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => new URL(entry.name).pathname))

  expect(fonts).not.toContain(`${normalFont}.woff2`)
})

test('subsets retain the original glyph metrics across variable weights and italic text', async ({ page }) => {
  await page.goto('/')

  const comparisons = await page.evaluate(async ({ normal, italic, sample }) => {
    const renderedSample = document.createElement('span')

    renderedSample.style.font = 'italic 400 32px Montserrat'
    renderedSample.textContent = sample
    document.body.append(renderedSample)
    renderedSample.getBoundingClientRect()
    await document.fonts.ready

    const subsetUrls = performance.getEntriesByType('resource').map(entry => entry.name)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) throw new Error('A canvas context is required to verify font metrics')

    const results: { style: string, weight: number, text: string, original: number, subset: number }[] = []

    for (const style of ['normal', 'italic']) {
      const path = style === 'normal' ? normal : italic
      const filename = path.slice(path.lastIndexOf('/') + 1)
      const subsetUrl = subsetUrls.find(url => url.includes(`${filename}.latin.`))

      if (!subsetUrl) throw new Error(`Missing loaded ${style} subset`)

      const original = new FontFace(`Original-${style}`, `url(${path}.woff2)`, { style, weight: '100 900' })
      const subset = new FontFace(`Subset-${style}`, `url(${subsetUrl})`, { style, weight: '100 900' })

      document.fonts.add(await original.load())
      document.fonts.add(await subset.load())

      for (const weight of [100, 350, 400, 600, 900]) {
        for (const text of [sample, sample.normalize('NFD'), 'AVATAR office affinity 0123456789']) {
          context.font = `${style} ${weight} 32px Original-${style}`

          const originalWidth = context.measureText(text).width

          context.font = `${style} ${weight} 32px Subset-${style}`
          results.push({ style, weight, text, original: originalWidth, subset: context.measureText(text).width })
        }

        renderedSample.textContent = '0123456789'
        renderedSample.style.font = `${style} ${weight} 32px Original-${style}`
        renderedSample.style.fontVariantNumeric = 'tabular-nums'

        const originalWidth = renderedSample.getBoundingClientRect().width

        renderedSample.style.fontFamily = `Subset-${style}`
        results.push({ style, weight, text: 'tabular digits', original: originalWidth, subset: renderedSample.getBoundingClientRect().width })
      }
    }

    return results
  }, { normal: normalFont, italic: italicFont, sample: latinSample })

  for (const comparison of comparisons) {
    expect(comparison.subset, `${comparison.style} ${comparison.weight}: ${comparison.text}`).toBeCloseTo(comparison.original, 3)
  }
})
