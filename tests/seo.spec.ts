/* eslint @typescript-eslint/no-unsafe-assignment: off, @typescript-eslint/no-unsafe-member-access: off, jest-dom/prefer-to-have-class: off, testing-library/prefer-screen-queries: off */
// TODO: These are Playwright specs; remove when DOM Testing Library rules stop applying here.
import { expect, test } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

test.describe('SEO — meta tags', () => {
  test('utility pages are noindex and the offline page is excluded from the sitemap', async ({ page }) => {
    for (const path of ['/404/', '/offline/']) {
      await page.goto(path)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    }

    const sitemapResponse = await page.request.get('/sitemap-0.xml')
    const sitemap = await sitemapResponse.text()

    expect(sitemap).not.toContain('https://santi020k.com/offline/')
    expect(sitemap).not.toContain('https://santi020k.com/404/')
  })

  test('syndicated posts honor their declared canonical URL', async ({ page }) => {
    await page.goto('/blog/atomic-module-component-structure-for-react/')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c'
    )
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content', 'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c'
    )
  })

  test('rendered titles and descriptions stay within the project SEO limits', async ({ page }) => {
    for (const path of [
      '/',
      '/about/',
      '/blog/2/',
      '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/',
      '/portfolio/xgames/',
      '/technologies/design-systems/'
    ]) {
      await page.goto(path)

      const title = await page.title()
      const description = await page.locator('meta[name="description"]').getAttribute('content')

      expect(title.length, `title is too long on ${path}`).toBeLessThanOrEqual(60)
      expect(description?.length, `description is too short on ${path}`).toBeGreaterThanOrEqual(120)
      expect(description?.length, `description is too long on ${path}`).toBeLessThanOrEqual(160)
    }
  })

  test('priority search pages render complete intent-specific snippets', async ({ page }) => {
    const priorityPages = [
      {
        path: '/',
        title: 'Santiago Molina — Engineering Leader & Architect | santi020k'
      },
      {
        path: '/work/',
        title: 'Santiago Molina — Engineering Leadership Work | santi020k'
      },
      {
        path: '/blog/authentication-and-authorization-in-next-js-applications-with-supabase/',
        title: 'Next.js Supabase Auth: SSR & Route Protection | santi020k'
      },
      {
        path: '/blog/eslint-config-basic-version-2/',
        title: 'ESLint Config Basic v2: ESLint 10 & Frameworks | santi020k'
      },
      {
        path: '/blog/continuous-integration-and-deployment-for-next-js-projects/',
        title: 'Next.js CI/CD with GitHub Actions | santi020k'
      },
      {
        path: '/portfolio/astro-doctor/',
        title: 'Astro Doctor: Astro Code Quality Toolkit | santi020k'
      },
      {
        path: '/portfolio/void/',
        title: 'Void.GG: Esports Platform Engineering | santi020k'
      },
      {
        path: '/portfolio/santi020k-theme/',
        title: 'Santi020k Theme: Editors, Chrome & Terminals | santi020k'
      }
    ]

    for (const { path, title } of priorityPages) {
      await page.goto(path)

      const description = await page.locator('meta[name="description"]').getAttribute('content')

      await expect(page).toHaveTitle(title)
      expect(description, `description is truncated on ${path}`).not.toContain('…')
      expect(description?.length, `description is too short on ${path}`).toBeGreaterThanOrEqual(120)
      expect(description?.length, `description is too long on ${path}`).toBeLessThanOrEqual(160)
    }
  })

  test('technology pages use lowercase hyphenated canonical paths', async ({ page }) => {
    await page.goto('/technologies/design-systems/')

    await expect(page).toHaveURL(/\/technologies\/design-systems\/$/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://santi020k.com/technologies/design-systems/'
    )
  })

  test('resume links keep one stable canonical PDF URL', async ({ page }) => {
    await page.goto('/resume/')

    const pdfLinks = page.locator('a[href="/pdf/cv.pdf"]')

    await expect(pdfLinks).toHaveCount(2)
    await expect(page.locator('a[href^="/pdf/cv.pdf?"]')).toHaveCount(0)
  })

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
    expect(websiteSchema.name).toBe('Santiago Molina')
    expect(websiteSchema.alternateName).toBe('santi020k')
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
