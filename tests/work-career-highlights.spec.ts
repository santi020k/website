import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'

const highlights = [
  { label: 'Professional roles', value: /^\d+$/u, description: 'Across commerce, gaming, agencies, and SaaS.' },
  { label: 'Largest team led', value: '14', description: 'Product, design, frontend, and backend.' },
  { label: 'Production technologies', value: /^\d+$/u, description: 'Tools chosen to fit the product.' },
  { label: 'Faster deployments', value: '60%', description: 'Through CI/CD and improved release workflows.' }
]

for (const theme of ['light', 'dark'] as const) {
  test(`Work career highlights keep metrics and context readable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/work/')
    const section = page.getByRole('region', { name: 'Career at a glance' })
    const articles = section.getByRole('article')

    await expect(articles).toHaveCount(highlights.length)
    for (const highlight of highlights) {
      const article = section.getByRole('article', { name: highlight.label })

      await expect(article.getByRole('heading', { level: 2 })).toHaveText(highlight.label)
      await expect(article.locator('.work-stat-value')).toHaveText(highlight.value)
      await expect(article.locator('[data-work-stat-copy] > p')).toHaveText(highlight.description)
    }
    await expect(section.getByRole('article', { name: 'Professional roles' }).locator('.work-stat-value'))
      .toHaveText(String(await page.locator('[data-career-timeline] [data-timeline-row]').count()))
    for (const width of [320, 390, 768, 1024, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const overflow = await articles.evaluateAll(rows => rows.flatMap(row => {
          const bounds = row.getBoundingClientRect()

          return [...row.querySelectorAll('h2, p, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < Math.max(0, bounds.left) - 1 ||
              rect.right > Math.min(innerWidth, bounds.right) + 1 ||
              rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        }))

        expect(overflow, `Career at a glance at ${width}px and ${size}% must fit`).toEqual([])
        const overlaps = await articles.evaluateAll(rows => rows.some(row => {
          const value = row.querySelector('.work-stat-value')?.getBoundingClientRect()
          const copy = row.querySelector('[data-work-stat-copy]')?.getBoundingClientRect()

          return value && copy && value.right > copy.left + 1 && value.bottom > copy.top + 1
        }))

        expect(overlaps, 'Figures must not overlap their explanations').toBe(false)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await expectNoUnexpectedAccessibilityViolations(page)
  })
}

test('career evidence captions reach the relevant sections and preserve keyboard focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const sources = [
    { name: 'Explore the timeline', href: '#experience-heading', heading: 'The work, over time.' },
    { name: 'Explore the toolkit', href: '#tools-heading', heading: 'The tools behind the work.' },
    { name: 'Void.GG · What I led', href: '/portfolio/void/#what-i-led', heading: 'What I led' },
    { name: 'Void.GG · Key outcomes', href: '/portfolio/void/#key-outcomes', heading: 'Key outcomes' }
  ]

  for (const source of sources) {
    await page.goto('/work/')
    const link = page.getByRole('region', { name: 'Career at a glance' }).getByRole('link', { name: source.name, exact: true })

    await expect(link).toHaveAttribute('href', source.href)
    await link.focus()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: source.heading, exact: true })).toBeInViewport()
    expect(new URL(page.url()).hash).toBe(source.href.slice(source.href.indexOf('#')))
  }
})

for (const route of ['/work/', '/es/work/']) {
  test(`Work introduction keeps whole words and visible actions with enlarged text at ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(route)
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(async () => {
        document.documentElement.style.fontSize = '200%'
        await document.fonts.ready
      })
      const broken = await page.locator('#work-heading, [data-work-eyebrow-copy]').evaluateAll(elements => elements.flatMap(element => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
        const words: string[] = []
        let node = walker.nextNode()

        while (node) {
          for (const match of (node.textContent ?? '').matchAll(/\p{L}+/gu)) {
            const range = document.createRange()

            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            const lines = new Set([...range.getClientRects()]
              .filter(rect => rect.width > 0).map(rect => Math.round(rect.y)))

            if (lines.size > 1) words.push(match[0])
          }
          node = walker.nextNode()
        }
        return words
      }))

      expect(broken, `Headline and eyebrow words must stay whole at ${width}px`).toEqual([])
      const actions = page.locator('[data-work-hero-actions] a')

      await expect(actions).toHaveCount(3)
      for (const link of await actions.all()) {
        const bounds = await link.boundingBox()

        expect(bounds?.x).toBeGreaterThanOrEqual(0)
        expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
  })
}
