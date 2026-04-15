/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect, test } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

test.describe('SEO — meta tags', () => {
  test('homepage has a valid og:image pointing to the generated PNG', async ({ page }) => {
    await page.goto('/')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    // Root uses the default webp fallback (no OG slug for '/')
    expect(ogImage).toContain('.webp')
  })

  test('blog index has an og:image pointing to the generated pages PNG', async ({ page }) => {
    await page.goto('/blog/')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    expect(ogImage).toMatch(/\/og\/pages\/.+\.webp$/)
  })

  test('about page has an og:image pointing to the generated pages PNG', async ({ page }) => {
    await page.goto('/about/')

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    expect(ogImage).toMatch(/\/og\/pages\/.+\.webp$/)
  })

  test('og:image:alt and twitter:image:alt are set on the homepage', async ({ page }) => {
    await page.goto('/')

    const ogAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content')
    const twitterAlt = await page.locator('meta[name="twitter:image:alt"]').getAttribute('content')

    expect(ogAlt).toBeTruthy()
    expect(twitterAlt).toBeTruthy()
  })

  test('og:image:alt contains meaningful text (not just generic "Preview image for")', async ({ page }) => {
    await page.goto('/about/')

    const ogAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content')

    expect(ogAlt).toBeTruthy()
    // The old generic fallback was "Preview image for <title>"; the new value
    // should use the description or a custom alt — not start with "Preview image"
    expect(ogAlt).not.toMatch(/^Preview image for /i)
  })

  test('blog post has an og:image URL that includes the post slug', async ({ page }) => {
    await page.goto('/blog/')

    // Navigate specifically into a blog post (avoiding series links)
    const firstPost = page.locator('article').filter({ hasText: /Read more/i }).locator('a').first()
    const href = await firstPost.getAttribute('href')
    expect(href).toBeTruthy()

    if (href) {
      await page.goto(href)
    }

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
    // Blog post OG images live under /og/blog/
    expect(ogImage).toMatch(/\/og\/blog\/.+\.webp$/)
  })

  test('every page has og:title and og:description', async ({ page }) => {
    for (const path of ['/', '/blog/', '/about/', '/speaking/']) {
      await page.goto(path)

      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
      const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content')

      expect(ogTitle, `og:title missing on ${path}`).toBeTruthy()
      expect(ogDesc, `og:description missing on ${path}`).toBeTruthy()
    }
  })
})

test.describe('SEO — JSON-LD structured data', () => {
  test('homepage has a Person schema with an @id', async ({ page }) => {
    await page.goto('/')

    const personSchema = await page.evaluate((): any => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json = JSON.parse(content)
          if (json['@type'] === 'Person') return json
        } catch { /* skip */ }
      }
      return null
    })

    expect(personSchema).not.toBeNull()
    expect(personSchema['@id']).toMatch(/#person$/)
    expect(personSchema.name).toBeTruthy()
    expect(personSchema.jobTitle).toBeTruthy()
  })

  test('homepage has an Organization schema with a logo', async ({ page }) => {
    await page.goto('/')

    const orgSchema = await page.evaluate((): any => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json = JSON.parse(content)
          if (json['@type'] === 'Organization') return json
        } catch { /* skip */ }
      }
      return null
    })

    expect(orgSchema).not.toBeNull()
    expect(orgSchema['@id']).toMatch(/#organization$/)
    expect(orgSchema.name).toBeTruthy()
    expect(orgSchema.logo).toBeDefined()
    expect(orgSchema.logo['@type']).toBe('ImageObject')
    expect(orgSchema.logo.url).toMatch(/\.webp$/)
  })

  test('Organization schema links back to the Person schema via founder', async ({ page }) => {
    await page.goto('/')

    const orgSchema = await page.evaluate((): any => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json = JSON.parse(content)
          if (json['@type'] === 'Organization') return json
        } catch { /* skip */ }
      }
      return null
    })

    expect(orgSchema?.founder?.['@id']).toMatch(/#person$/)
  })

  test('blog post page has its own JSON-LD schema', async ({ page }) => {
    await page.goto('/blog/')
    const firstPostHref = await page.locator('article').filter({ hasText: /Read more/i }).locator('a').first().getAttribute('href')
    if (firstPostHref) {
      await page.goto(firstPostHref)
    }

    const hasStructuredData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return scripts.length > 0
    })

    expect(hasStructuredData).toBe(true)
  })
})
