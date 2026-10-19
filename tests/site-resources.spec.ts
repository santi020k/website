import { expect, test } from '@playwright/test'
import { z } from 'astro/zod'

import { siteConfig } from '../src/site.config'

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
