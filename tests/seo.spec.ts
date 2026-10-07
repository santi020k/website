import { expect, type Page, test } from '@playwright/test'

const findSchema = async (page: Page, type: string) => {
  const contents = await page.locator('script[type="application/ld+json"]').allTextContents()
  const schemas = contents.map((content): unknown => JSON.parse(content)).flat()

  return schemas.find((value): value is Record<string, unknown> => typeof value === 'object' && value !== null && '@type' in value && value['@type'] === type)
}

test.describe('SEO — meta tags', () => {
  test('AI search crawlers have explicit access without indexing the search payload', async ({ page }) => {
    const robotsResponse = await page.request.get('/robots.txt')
    const robots = await robotsResponse.text()

    for (const userAgent of ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User']) {
      expect(robots).toContain(`User-agent: ${userAgent}`)
    }

    expect(robots).toContain('Disallow: /search-index.json')
  })

  test('developer experience hub is canonical, indexable, and connected to the blog', async ({ page }) => {
    await page.goto('/developer-experience/')

    await expect(page).toHaveTitle(/Developer Experience/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://santi020k.com/developer-experience/'
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build a system that')
    await expect(page.locator('article a[href^="/blog/"]')).toHaveCount(6)
  })

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

  test('non-empty taxonomy pages are indexable and included in the sitemap', async ({ page }) => {
    const sparseTaxonomyPaths = [
      '/blog/tags/alpine/',
      '/technologies/actionlint/'
    ]

    for (const path of sparseTaxonomyPaths) {
      await page.goto(path)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content', /\bindex, follow\b/u
      )
    }

    const sitemapResponse = await page.request.get('/sitemap-0.xml')
    const sitemap = await sitemapResponse.text()

    for (const path of sparseTaxonomyPaths) {
      expect(sitemap).toContain(`https://santi020k.com${path}`)
    }

    expect(sitemap).toContain('https://santi020k.com/technologies/typescript/')
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

  test('renders complete authored descriptions without padding short pages', async ({ page }) => {
    const pages = [
      { path: '/404/', description: 'The page you are looking for could not be found.' },
      {
        path: '/portfolio/xgames/',
        description: 'Built and scaled the official X Games digital platform — a high-traffic sports media site serving millions of fans — with real-time live streaming, geo-based access control, and a programmatic ad infrastructure powered by Google Ad Manager.'
      },
      {
        path: '/blog/why-developer-experience-work-should-be-measured-like-product-work/',
        description: 'Measure developer experience with cycle time, feedback speed, onboarding time, recovery time, and tooling interruptions. Start with a baseline.'
      }
    ]

    for (const { path, description } of pages) {
      await page.goto(path)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description)
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description)
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description)
    }
  })

  test('a concise search title preserves the full visible and social headline', async ({ page }) => {
    const headline = 'Configuring MongoDB with Homebrew on macOS: Converting a Standalone Instance to a Replica Set'

    await page.goto('/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/')

    await expect(page).toHaveTitle('MongoDB Replica Set on macOS with Homebrew | santi020k')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', headline)
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', headline)
  })

  test('uses seoTitle only for the document title', async ({ page }) => {
    const headline = 'Authentication and Authorization in Next.js Applications with Supabase'

    await page.goto('/blog/authentication-and-authorization-in-next-js-applications-with-supabase/')

    await expect(page).toHaveTitle('Next.js Supabase Auth: SSR & Route Protection | santi020k')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', headline)
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', headline)
  })

  test('priority search pages render complete intent-specific snippets', async ({ page }) => {
    const priorityPages = [
      {
        path: '/',
        title: 'Santiago Molina — Full-Stack Engineer & Tech Lead | santi020k'
      },
      {
        path: '/blog/flash-xteink-x4-international-firmware/',
        title: 'Xteink X4: Flash International Firmware | santi020k'
      },
      {
        path: '/blog/shipping-macos-tools-with-a-homebrew-tap/',
        title: 'Shipping macOS Tools with a Homebrew Tap | santi020k'
      },
      {
        path: '/portfolio/lumen-ui/',
        title: 'Lumen UI: Web and Native Component Library | santi020k'
      },
      {
        path: '/portfolio/postlens/',
        title: 'PostLens: Private Photo Editing for iPhone | santi020k'
      },
      {
        path: '/portfolio/roadscore/',
        title: 'RoadScore: Offline Road-Trip Game | santi020k'
      },
      {
        path: '/portfolio/quality/',
        title: 'Quality: One CLI for Repository Checks | santi020k'
      },
      {
        path: '/portfolio/og/',
        title: '@santi020k/og: Open Graph Image Generation | santi020k'
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
        title: 'Santi020k Theme: Zed, Codex & More | santi020k'
      }
    ]

    for (const { path, title } of priorityPages) {
      await page.goto(path)

      const description = await page.locator('meta[name="description"]').getAttribute('content')

      await expect(page).toHaveTitle(title)
      expect(description, `description is truncated on ${path}`).not.toContain('…')
      expect(description, `description is missing on ${path}`).toMatch(/\S/u)
      expect(description).not.toContain('through personal experiences, useful discoveries')
    }
  })

  test('technology pages use lowercase hyphenated canonical paths', async ({ page }) => {
    await page.goto('/technologies/design-systems/')

    await expect(page).toHaveURL(/\/technologies\/design-systems\/$/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://santi020k.com/technologies/design-systems/'
    )
  })

  test('resume links keep stable canonical PDF URLs', async ({ page }) => {
    await page.goto('/resume/')

    const shortPdfLink = page.locator('a[href="/pdf/cv.pdf"]')
    const fullPdfLink = page.locator('a[href="/pdf/cv-full.pdf"]')

    await expect(shortPdfLink).toHaveAttribute('download', 'santiago-molina-resume.pdf')
    await expect(fullPdfLink).toHaveAttribute('download', 'santiago-molina-full-cv.pdf')
    await expect(page.locator('a[href^="/pdf/cv.pdf?"]')).toHaveCount(0)
    await expect(page.locator('a[href^="/pdf/cv-full.pdf?"]')).toHaveCount(0)
  })

  test('resume keeps the full work history on the web and a concise print layout', async ({ page }) => {
    await page.goto('/resume/')

    const earlierExperience = page.getByRole('heading', { name: 'Earlier Experience' })

    await expect(earlierExperience).toBeVisible()
    await expect(page.getByText('Two-page resume for applications · Full CV with complete work history')).toBeVisible()
    await expect(page.getByText(/^\+\d+ more$/u)).toHaveCount(0)

    await page.emulateMedia({ media: 'print' })
    await expect(earlierExperience).toBeHidden()
  })

  test('resume structured data uses a valid stable modification date', async ({ page }) => {
    await page.goto('/resume/')

    const profilePageSchema = await page.evaluate((): unknown => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))

      for (const script of scripts) {
        try {
          const content = script.textContent
          if (!content) continue
          const json: unknown = JSON.parse(content)

          if (
            typeof json === 'object' &&
            json !== null &&
            '@type' in json &&
            json['@type'] === 'ProfilePage'
          ) return json
        } catch { /* skip */ }
      }

      return null
    })

    expect(profilePageSchema).toMatchObject({ dateModified: expect.any(String) })

    if (
      typeof profilePageSchema !== 'object' ||
      profilePageSchema === null ||
      !('dateModified' in profilePageSchema) ||
      typeof profilePageSchema.dateModified !== 'string'
    ) throw new TypeError('ProfilePage dateModified must be a string')

    const dateModified = new Date(profilePageSchema.dateModified)

    expect(Number.isNaN(dateModified.getTime())).toBe(false)
    expect(dateModified.toISOString()).toBe(profilePageSchema.dateModified)
    expect(dateModified.getTime()).toBeGreaterThanOrEqual(new Date('2024-01-01T00:00:00.000Z').getTime())
    expect(dateModified.getTime()).toBeLessThanOrEqual(Date.now())
  })

  test('resume print styles hide the decorative particle layer', async ({ page }) => {
    await page.goto('/resume/')

    const particles = page.locator('[data-particles-bg]')

    await expect(particles).toHaveCount(1)
    await page.emulateMedia({ media: 'print' })
    await expect(particles).toBeHidden()
  })

  test('homepage has a valid og:image pointing to the generated WebP', async ({ page }) => {
    await page.goto('/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    expect(ogImage).toBe('https://santi020k.com/og/pages/index.webp')
  })

  test('blog index has an og:image pointing to the generated pages WebP', async ({ page }) => {
    await page.goto('/blog/')

    const ogImageMeta = page.locator('meta[property="og:image"]')
    await expect(ogImageMeta).toHaveAttribute('content', /.+/)
    const ogImage = await ogImageMeta.getAttribute('content')
    expect(ogImage).toMatch(/\/og\/pages\/.+\.webp$/)
  })

  test('about page has an og:image pointing to the generated pages WebP', async ({ page }) => {
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
  test('speaking topics describe expertise without claiming to be FAQs', async ({ page }) => {
    await page.goto('/speaking/')

    const aboutSchema = await findSchema(page, 'AboutPage')

    expect(aboutSchema).toMatchObject({
      mainEntity: { knowsAbout: expect.arrayContaining([expect.stringMatching(/\S/u)]) },
      name: 'Speaking & Community'
    })
    expect(await findSchema(page, 'ItemList')).toBeDefined()
    expect(await findSchema(page, 'FAQPage')).toBeUndefined()
  })

  test('homepage has a WebSite schema with SearchAction', async ({ page }) => {
    await page.goto('/')

    const websiteSchema = await findSchema(page, 'WebSite')

    expect(websiteSchema).toMatchObject({
      alternateName: 'Santiago Molina',
      name: 'santi020k',
      potentialAction: { '@type': 'SearchAction' }
    })
  })

  test('WebSite site-name schema only appears on the domain homepage', async ({ page }) => {
    await page.goto('/resume/')

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()

    expect(schemas).not.toContainEqual(expect.stringContaining('"@type":"WebSite"'))
  })

  test('homepage has a Person schema with an @id', async ({ page }) => {
    await page.goto('/')

    const personSchema = await findSchema(page, 'Person')

    expect(personSchema).toMatchObject({
      '@id': expect.stringMatching(/#person$/u),
      jobTitle: expect.stringMatching(/\S/u),
      name: 'Santiago Molina'
    })
  })

  test('homepage has an Organization schema with a logo', async ({ page }) => {
    await page.goto('/')

    const orgSchema = await findSchema(page, 'Organization')

    expect(orgSchema).toMatchObject({
      '@id': expect.stringMatching(/#organization$/u),
      logo: { '@type': 'ImageObject', url: expect.stringMatching(/\.webp$/u) },
      name: expect.stringMatching(/\S/u)
    })
  })

  test('Organization schema links back to the Person schema via founder', async ({ page }) => {
    await page.goto('/')

    const orgSchema = await findSchema(page, 'Organization')

    expect(orgSchema).toMatchObject({ founder: { '@id': expect.stringMatching(/#person$/u) } })
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

  test('blog posts expose visible authorship and reference the global schema entities', async ({ page }) => {
    await page.goto('/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/')

    await expect(page.locator('a[rel="author"]')).toHaveAttribute('href', '/about/')
    await expect(page.locator('a[rel="author"]')).toHaveText('Santiago Molina')

    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
    const articleSchema = schemas.find(schema => schema.includes('"@type":"BlogPosting"'))

    expect(articleSchema).toContain('"@id":"https://santi020k.com/#person"')
    expect(articleSchema).toContain('"@id":"https://santi020k.com/#organization"')
    expect(articleSchema).toContain('"@id":"https://santi020k.com/#website"')
  })

  test('blog post page includes breadcrumb structured data', async ({ page }) => {
    await page.goto('/blog/atomic-module-component-structure-for-react/')

    const breadcrumbSchema = await findSchema(page, 'BreadcrumbList')

    const items: unknown = breadcrumbSchema?.itemListElement

    expect(Array.isArray(items)).toBe(true)

    if (!Array.isArray(items)) throw new Error('Breadcrumbs must be a list')

    expect(items.length).toBeGreaterThanOrEqual(3)
  })

  test('project structured data points to the published social image', async ({ page }) => {
    for (const projectId of ['og', 'quality']) {
      await page.goto(`/portfolio/${projectId}/`)

      const schemaContents = await page.locator('script[type="application/ld+json"]').allTextContents()
      const projectSchema = schemaContents
        .map(content => JSON.parse(content) as unknown)
        .find(value => typeof value === 'object' && value !== null && '@type' in value && (
          value['@type'] === 'CreativeWork' ||
          (Array.isArray(value['@type']) && value['@type'].includes('CreativeWork'))
        ))

      expect(projectSchema).toMatchObject({
        image: `https://santi020k.com/og/portfolio/${projectId}-logo.webp`
      })
    }
  })
})
