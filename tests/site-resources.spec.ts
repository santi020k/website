import { expect, test } from '@playwright/test'
import { z } from 'astro/zod'

import { siteConfig } from '../src/site.config'

import { requireValue } from './helpers/assertions'

test('a landscape article reuses its listing image transforms', async ({ page }) => {
  await page.goto('/blog/')
  const route = requireValue(await page.locator('[data-post-gallery-card]').evaluateAll(cards => {
    const landscapeCard = cards.find(card => {
      const image = card.querySelector('img')
      const width = Number(image?.getAttribute('width'))
      const height = Number(image?.getAttribute('height'))

      return width >= 1600 && height > 0 && width / height > 1.08
    })

    return landscapeCard?.querySelector('a')?.getAttribute('href')
  }))

  const listing = page.locator(`[data-post-gallery-card] a[href="${route}"] picture`).first()

  const listingSources = await listing.locator('source, img').evaluateAll(elements => elements.map(element => element.getAttribute('srcset') ?? ''))

  await page.goto(route)
  const hero = page.locator('[data-post-cover] picture')

  const transitionName = `post-cover-${requireValue(route.split('/').filter(Boolean).at(-1))}`
  const namedCovers = await page.locator('[data-post-cover] *').evaluateAll(elements => elements.map(element => getComputedStyle(element).viewTransitionName))

  expect(namedCovers.filter(name => name === transitionName)).toHaveLength(1)

  const heroSources = await hero.locator('source, img').evaluateAll(elements => elements.map(element => element.getAttribute('srcset') ?? ''))

  expect(listingSources).toHaveLength(2)
  expect(heroSources).toHaveLength(2)
  for (const [index, sources] of heroSources.entries()) {
    for (const width of [800, 1600]) {
      const candidate = sources.split(',').map(value => value.trim()).find(value => value.endsWith(` ${width}w`))

      expect(candidate).toBeDefined()
      expect(listingSources[index]).toContain(candidate)
    }
  }
})

test('blog pictures keep responsive AVIF sources and compact WebP fallbacks', async ({ page, request }) => {
  await page.goto('/blog/')
  const pictures = page.locator('[data-blog-latest] picture, [data-post-gallery-card] picture')

  expect(await pictures.count()).toBeGreaterThan(1)

  for (const picture of await pictures.all()) {
    await expect(picture.locator('source')).toHaveAttribute('type', 'image/avif')
    const fallback = picture.locator('img')

    await expect(fallback).toHaveAttribute('src', /\.webp$/u)
    await expect(fallback).toHaveAttribute('srcset', /\.webp \d+w/u)
    await expect(fallback).toHaveAttribute('sizes', /\S/u)

    const src = await fallback.getAttribute('src') ?? ''

    expect(src).not.toBe('')

    const response = await request.get(src)

    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image/webp')
  }
})

for (const route of ['/projects/', '/technologies/typescript/']) {
  test(`Lumen covers use responsive AVIF and WebP on ${route}`, async ({ page, request }) => {
    await page.goto(route)
    const pictures = page.locator('.ui-cover-image picture')

    expect(await pictures.count()).toBeGreaterThan(0)

    for (const picture of await pictures.all()) {
      await expect(picture.locator('source')).toHaveAttribute('type', 'image/avif')
      const fallback = picture.locator('img')

      await expect(fallback).toHaveAttribute('src', /\.webp$/u)
      await expect(fallback).toHaveAttribute('srcset', /\.webp \d+w/u)
      const src = await fallback.getAttribute('src') ?? ''

      expect(src).not.toBe('')
      const response = await request.get(src)

      expect(response.ok()).toBe(true)
      expect(response.headers()['content-type']).toContain('image/webp')
    }
  })
}

test('article covers retain responsive AVIF and WebP with natural image dimensions', async ({ page }) => {
  await page.goto('/blog/run-repo-on-mac-with-silo-dxmt/')
  const cover = page.locator('[data-post-cover] picture')

  await expect(cover.locator('source')).toHaveAttribute('type', 'image/avif')
  await expect(cover.locator('img')).toHaveAttribute('src', /\.webp$/u)
  const dimensions = await cover.locator('img').evaluate(async (image: HTMLImageElement) => {
    await image.decode()

    return {
      declaredRatio: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
      actualRatio: image.naturalWidth / image.naturalHeight
    }
  })

  expect(dimensions.declaredRatio).toBeCloseTo(dimensions.actualRatio, 2)
})

for (const route of ['/portfolio/smith-commerce/', '/portfolio/lumen-ui/']) {
  test(`project covers keep unnamed transitions on ${route}`, async ({ page }) => {
    await page.goto(route)
    const cover = page.locator('[data-project-cover]')

    await expect(cover).toHaveCount(1)
    await expect(cover.locator('[data-astro-transition-scope]')).toHaveCount(0)
  })
}

const manifestSchema = z.object({
  name: z.string(),
  short_name: z.string(),
  description: z.string(),
  lang: z.string(),
  id: z.string(),
  start_url: z.string(),
  scope: z.string(),
  theme_color: z.string(),
  background_color: z.string(),
  display: z.string(),
  icons: z.array(z.object({ src: z.string(), sizes: z.string(), type: z.string(), purpose: z.string().optional() }))
})

test('crawler policies preserve discovery and exclude only the duplicate search payload', async ({ request }) => {
  const response = await request.get('/robots.txt')

  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('text/plain')
  const robots = await response.text()
  const policies = robots.replace(/^Sitemap:.*$/mu, '').trim().split(/\n\s*\n/u)

  expect(policies).toHaveLength(5)

  for (const [index, userAgent] of ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User', '*'].entries()) {
    expect(policies[index]).toBe(`User-agent: ${userAgent}\nDisallow: /search-index.json\nAllow: /`)
  }

  expect(robots).toContain('Sitemap: https://santi020k.com/sitemap.xml')
})

test('install manifest keeps identity, launch scope, and generated icon contracts', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  const response = await request.get('/manifest.webmanifest')

  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toMatch(/application\/(?:manifest\+)?json/u)
  const data: unknown = await response.json()
  const manifest = manifestSchema.parse(data)

  expect(manifest).toEqual({
    name: siteConfig.title,
    short_name: 'santi020k',
    description: siteConfig.description,
    lang: siteConfig.lang,
    id: '/',
    start_url: '/',
    scope: '/',
    theme_color: '#09040f',
    background_color: '#09040f',
    display: 'standalone',
    icons: [
      { src: 'apple-touch-icon.webp', sizes: '180x180', type: 'image/webp' },
      { src: 'icons/icon-192.webp', sizes: '192x192', type: 'image/webp', purpose: 'any maskable' },
      { src: 'icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any maskable' }
    ]
  })

  for (const icon of manifest.icons) {
    const image = await request.get(`/${icon.src}`)

    expect(image.ok()).toBe(true)
    expect(image.headers()['content-type']).toContain(icon.type)
    const dimensions = await page.evaluate(async src => {
      const image = new Image()

      image.src = `/${src}`

      await image.decode()

      return `${image.naturalWidth}x${image.naturalHeight}`
    }, icon.src)

    expect(dimensions).toBe(icon.sizes)
  }
})

for (const route of ['/portfolio/', '/portfolio/smith-commerce/']) {
  test(`portfolio artwork keeps AVIF and WebP without PNG fallbacks on ${route}`, async ({ page, request }) => {
    await page.goto(route)
    const pictures = page.locator('[data-portfolio-project] picture, [data-project-cover] picture')

    expect(await pictures.count()).toBeGreaterThan(0)
    for (const picture of await pictures.all()) {
      await expect(picture.locator('source')).toHaveAttribute('type', 'image/avif')
      const fallback = picture.locator('img')

      await expect(fallback).toHaveAttribute('src', /\.webp$/u)
      await expect(fallback).toHaveAttribute('srcset', /\.webp \d+w/u)
      const source = await fallback.getAttribute('src') ?? ''

      expect(source).not.toBe('')
      const response = await request.get(source)

      expect(response.ok()).toBe(true)
      expect(response.headers()['content-type']).toContain('image/webp')
    }
  })
}

test('organization logos provide bounded responsive assets', async ({ page, request }) => {
  await page.goto('/about/')
  const logos = page.locator('[data-carousel-logo] img:last-child')

  expect(await logos.count()).toBeGreaterThan(0)
  for (const logo of await logos.all()) {
    await expect(logo).toHaveAttribute('sizes', /^\d+rem$/u)
    await expect(logo).toHaveAttribute('srcset', /\.webp \d+w/u)
    const width = Number(await logo.getAttribute('width'))

    expect(width).toBeLessThanOrEqual(832)
    const source = await logo.getAttribute('src') ?? ''

    expect(source).not.toBe('')
    const response = await request.get(source)

    expect(response.ok()).toBe(true)
    expect(response.headers()['content-type']).toContain('image/webp')
  }
})
