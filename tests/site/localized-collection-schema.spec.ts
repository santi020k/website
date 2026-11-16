import { expect, type Page, test } from '@playwright/test'
import { z } from 'astro/zod'

const origin = 'https://santi020k.com'
const graphSchema = z.object({ '@graph': z.array(z.unknown()).optional() })
const schemaType = z.object({ '@type': z.string() })
const listItemSchema = z.object({
  name: z.string().min(1),
  position: z.number().int().positive(),
  url: z.url()
})
const blogPostSchema = z.object({
  headline: z.string().min(1),
  description: z.string().min(1),
  datePublished: z.iso.datetime(),
  position: z.number().int().positive(),
  url: z.url()
})
const blogSchema = z.object({
  url: z.url(),
  blogPost: z.array(blogPostSchema).min(1)
})

const readSchemas = async (page: Page, type: string) => {
  const contents = await page.locator('script[type="application/ld+json"]').allTextContents()
  const documents = contents.map((content): unknown => JSON.parse(content)).flat()
  const nodes = documents.flatMap(document => graphSchema.parse(document)['@graph'] ?? [document])

  return nodes.filter(node => {
    const parsed = schemaType.safeParse(node)

    return parsed.success && parsed.data['@type'] === type
  })
}

test.describe('localized collection structured data', () => {
  test.use({ javaScriptEnabled: false })

  for (const prefix of ['', '/es']) {
    const articlePath = prefix ? /^\/es\/blog\//u : /^\/blog\//u

    for (const archive of ['', '2/']) {
      test(`${prefix || 'English'} blog ${archive || 'first page'} schema matches its article cards`, async ({ page }) => {
        await page.goto(`${prefix}/blog/${archive}`)

        const schemas = await readSchemas(page, 'Blog')
        const [blog] = z.tuple([blogSchema]).parse(schemas)

        const cards = await page.locator('[data-post-gallery-card]').evaluateAll((elements, siteOrigin) => elements.map((card, index) => ({
          headline: card.querySelector('h3')?.textContent.trim(),
          datePublished: card.querySelector('time')?.getAttribute('datetime'),
          position: index + 1,
          url: new URL(card.querySelector('a')?.getAttribute('href') ?? '', siteOrigin).href
        })), origin)

        expect(blog.url).toBe(`${origin}${prefix}/blog/`)
        expect(blog.blogPost.map(post => ({
          headline: post.headline,
          datePublished: post.datePublished,
          position: post.position,
          url: post.url
        }))).toEqual(cards)

        for (const post of blog.blogPost) {
          expect(new URL(post.url).pathname).toMatch(articlePath)
        }
      })
    }

    test(`${prefix || 'English'} blog schema describes the featured article`, async ({ page }) => {
      await page.goto(`${prefix}/blog/`)

      const [blog] = z.tuple([blogSchema]).parse(await readSchemas(page, 'Blog'))
      const firstPost = blogPostSchema.parse(blog.blogPost[0])

      await expect(page.locator('[data-latest-link] h2')).toHaveText(firstPost.headline)
      await expect(page.locator('[data-latest-description]')).toHaveText(firstPost.description)
    })

    test(`${prefix || 'English'} series schema matches its chapter cards`, async ({ page }) => {
      const path = `${prefix}/blog/series/the-santi020k-way/`

      await page.goto(path)

      const schemas = await readSchemas(page, 'CollectionPage')
      const [series] = z.tuple([z.object({
        url: z.url(),
        hasPart: z.array(listItemSchema).min(1)
      })]).parse(schemas)

      const chapters = await page.locator('[data-post-gallery-card]').evaluateAll((elements, siteOrigin) => elements.map((card, index) => ({
        name: card.querySelector('h3')?.textContent.trim(),
        position: index + 1,
        url: new URL(card.querySelector('a')?.getAttribute('href') ?? '', siteOrigin).href
      })), origin)

      expect(series.url).toBe(`${origin}${path}`)
      expect(series.hasPart).toEqual(chapters)

      for (const chapter of series.hasPart) {
        expect(new URL(chapter.url).pathname).toMatch(articlePath)
      }
    })

    test(`${prefix || 'English'} homepage schemas match the visible writing and projects`, async ({ page }) => {
      await page.goto(`${prefix}/`)

      const schemas = await readSchemas(page, 'ItemList')
      const lists = z.array(z.object({ itemListElement: z.array(listItemSchema).min(1) })).length(3).parse(schemas)
      const visibleLists: z.infer<typeof listItemSchema>[][] = []

      for (const selector of [
        '[data-home-showcase="work"] [data-project-card], [data-home-showcase="work"] [data-showcase-item]',
        '[data-home-showcase="projects"] [data-project-card], [data-home-showcase="projects"] [data-showcase-item]',
        '[data-writing-row]'
      ]) {
        const entries = await page.locator(selector).evaluateAll(
          (elements, siteOrigin) => elements.map((link, index) => ({
            name: link.querySelector('h3, h4')?.textContent.trim(),
            position: index + 1,
            url: new URL(link.getAttribute('href') ?? '', siteOrigin).href
          })), origin
        )

        visibleLists.push(z.array(listItemSchema).min(1).parse(entries))
      }

      expect(lists.map(list => list.itemListElement)).toEqual(expect.arrayContaining(visibleLists))

      for (const list of lists) {
        for (const entry of list.itemListElement) {
          expect(new URL(entry.url).pathname.startsWith('/es/')).toBe(prefix === '/es')
        }
      }
    })
  }
})
