import { expect, type Page, test } from '@playwright/test'

const articles = [
  {
    canonical: 'https://santi020k.com/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/',
    path: '/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/',
    title: 'AI Coding Is Probabilistic. Your Delivery Process Should Not Be.'
  },
  {
    // Syndicated articles keep their own permalink in the h-entry.
    canonical: 'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c',
    path: '/blog/atomic-module-component-structure-for-react/',
    title: 'Atomic Module Component Structure for React'
  }
]

// Reads the properties a microformats2 parser assigns to the article h-entry.
// A property belongs to the nearest enclosing root, so nested h-card
// properties are excluded from the entry.
const readEntry = (page: Page) => page.locator('.h-entry').evaluate(entry => {
  const owned = (selector: string) => [...entry.querySelectorAll<HTMLElement>(selector)]
    .filter(element => element.parentElement?.closest('.h-entry, .h-card') === entry)

  return {
    authors: owned('.p-author').map(element => ({
      card: element.classList.contains('h-card'),
      href: element.getAttribute('href'),
      otherProperties: [...element.classList].filter(name => /^(?:p|u|dt|e)-/u.test(name) && name !== 'p-author'),
      tag: element.tagName,
      text: element.textContent.trim()
    })),
    focusableUrls: entry.querySelectorAll('a.u-url').length,
    names: owned('.p-name').map(element => ({ tag: element.tagName, text: element.textContent.trim() })),
    urls: owned('.u-url').map(element => ({
      hidden: element.hidden,
      tag: element.tagName,
      value: element instanceof HTMLDataElement ? element.value : element.getAttribute('href')
    }))
  }
})

for (const javaScriptEnabled of [true, false]) {
  test.describe(`article microformats with JavaScript ${javaScriptEnabled}`, () => {
    test.use({ javaScriptEnabled })

    for (const article of articles) {
      test(`${article.path} exposes one permalink, title, and nested author`, async ({ page }) => {
        await page.goto(article.path)

        await expect(page.locator('.h-entry')).toHaveCount(1)
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', article.canonical)

        const entry = await readEntry(page)
        const permalink = new URL(article.path, 'https://santi020k.com').href

        expect(entry.urls).toEqual([{ hidden: true, tag: 'DATA', value: permalink }])
        expect(entry.focusableUrls).toBe(0)
        expect(entry.names).toEqual([{ tag: 'H1', text: article.title }])
        expect(entry.authors).toEqual([{
          card: true,
          href: '/about/',
          otherProperties: [],
          tag: 'A',
          text: 'Santiago Molina'
        }])

        // The byline stays a visible author link.
        const byline = page.locator('[data-cover-byline]').getByRole('link', { name: 'Santiago Molina', exact: true })

        await expect(byline).toBeVisible()
        await expect(byline).toHaveAttribute('rel', 'author')
      })
    }
  })
}
