/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect, test } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

test.describe('SEO — meta tags', () => {
  test('homepage has a valid og:image pointing to the generated PNG', async ({ page }) => {
    await page.goto('/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    // Root uses the default webp fallback (no OG slug for '/')
    expect(ogImage).toContain('.webp')
  })

  test('blog index has an og:image pointing to the generated pages PNG', async ({ page }) => {
    await page.goto('/blog/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    expect(ogImage).toMatch(/\/og\/pages\/.+\.webp$/)
  })

  test('about page has an og:image pointing to the generated pages PNG', async ({ page }) => {
    await page.goto('/about/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    expect(ogImage).toMatch(/\/og\/pages\/.+\.webp$/)
  })

  test('og:image:alt and twitter:image:alt are set on the homepage', async ({ page }) => {
    await page.goto('/')

    const ogAltMeta = page.locator('meta[property="og:image:alt"]')
    const twitterAltMeta = page.locator('meta[name="twitter:image:alt"]')
    await expect(ogAltMeta).toHaveAttribute('content', /.+/)
    await expect(twitterAltMeta).toHaveAttribute('content', /.+/)
  })

  test('og:image:alt contains meaningful text (not just generic "Preview image for")', async ({ page }) => {
    await page.goto('/about/')

    const ogAltMeta = page.locator('meta[property="og:image:alt"]')
    await expect(ogAltMeta).toHaveAttribute('content', /.+/)
    const ogAlt = await ogAltMeta.getAttribute('content')
    // The old generic fallback was "Preview image for <title>"; the new value
    // should use the description or a custom alt — not start with "Preview image"
    expect(ogAlt).not.toMatch(/^Preview image for /i)
  })

  test('blog post has an og:image URL that includes the post slug', async ({ page }) => {
    await page.goto('/blog/')

    // Navigate specifically into a blog post (avoiding series links)
    const firstPost = page.locator('article a[href^="/blog/"]').first()
    await expect(firstPost).toHaveAttribute('href', /^\/blog\/.+\/$/)
    const href = await firstPost.getAttribute('href')

    expect(href).not.toBeNull()
    await page.goto(href ?? '/blog/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    // Blog post OG images live under /og/blog/
    expect(ogImage).toMatch(/\/og\/blog\/.+\.webp$/)
  })

  test('every page has og:title and og:description', async ({ page }) => {
    for (const path of ['/', '/blog/', '/about/', '/speaking/']) {
      await page.goto(path)

      const ogTitle = page.locator('meta[property="og:title"]')
      const ogDesc = page.locator('meta[property="og:description"]')
      await expect(ogTitle, `og:title missing on ${path}`).toHaveAttribute('content', /.+/)
      await expect(ogDesc, `og:description missing on ${path}`).toHaveAttribute('content', /.+/)
    }
  })
})

test.describe('SEO — JSON-LD structured data', () => {
  test('homepage has a WebSite schema with SearchAction', async ({ page }) => {
    await page.goto('/')

    const websiteSchema = await page.evaluate((): any => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json = JSON.parse(content)
          if (json['@type'] === 'WebSite') return json
        } catch { /* skip */ }
      }
      return null
    })

    expect(websiteSchema).not.toBeNull()
    expect(websiteSchema.potentialAction?.['@type']).toBe('SearchAction')
  })

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
    const firstPostHref = await page.locator('article a[href^="/blog/"]').first().getAttribute('href')
    expect(firstPostHref).not.toBeNull()
    await page.goto(firstPostHref ?? '/blog/')

    const hasStructuredData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return scripts.length > 0
    })

    expect(hasStructuredData).toBe(true)
  })

  test('blog post page includes breadcrumb structured data', async ({ page }) => {
    await page.goto('/blog/atomic-module-component-structure-for-react/')

    const breadcrumbSchema = await page.evaluate((): any => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json = JSON.parse(content)
          if (json['@type'] === 'BreadcrumbList') return json
        } catch { /* skip */ }
      }
      return null
    })

    expect(breadcrumbSchema).not.toBeNull()
    expect(Array.isArray(breadcrumbSchema.itemListElement)).toBe(true)
    expect(breadcrumbSchema.itemListElement.length).toBeGreaterThanOrEqual(3)
  })
})
