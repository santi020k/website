import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
  for (const { width, textSize } of [
    { width: 320, textSize: 200 },
    { width: 390, textSize: 100 },
    { width: 1024, textSize: 200 },
    { width: 1440, textSize: 100 }
  ]) {
    test(`project focus remains readable at ${width}px, ${textSize}% in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
      }, theme)
      for (const { slug, labels, descriptions } of [
        {
          slug: 'smith-commerce',
          labels: ['Marcone', 'F.W. Webb', 'Shared foundations'],
          descriptions: ['Headless storefront modernization', 'Purchasing and account workflows', 'Components, APIs, and delivery']
        },
        {
          slug: 'datagran',
          labels: ['Modernization', 'Product interfaces', 'Quality'],
          descriptions: ['Gradual migration from jQuery to React', 'Dashboards and marketing workflows', 'Typed components and testing']
        },
        {
          slug: 'lumen-ui',
          labels: ['Shared foundations', 'Platform adapters', 'Design workflow'],
          descriptions: ['Semantic tokens and explicit component contracts', 'Accessible interfaces across web and native stacks', 'Product layouts, Figma, and AI tooling']
        },
        {
          slug: 'justbit',
          labels: ['Technical direction', 'Studio delivery', 'Growth support'],
          descriptions: ['Architecture and stack choices for client products', 'Scoping, implementation, launch, and iteration', 'SEO, conversion, and cross-functional client work']
        },
        {
          slug: 'react-js-colombia',
          labels: ['Practical learning', 'Community care', 'Event delivery'],
          descriptions: ['Free React meetups and hands-on workshops', 'Mentorship for developers and first-time speakers', 'Topic curation, speaker support, and local logistics']
        }
      ]) {
        await page.goto(`/portfolio/${slug}/`)
        await page.evaluate(size => {
          document.documentElement.style.fontSize = `${size}%`
        }, textSize)
        await page.evaluate(() => document.fonts.ready)
        const card = page.getByRole('region', { name: 'Focus', exact: true })

        await expect(card.getByRole('heading', { name: 'Focus', level: 2 })).toBeVisible()
        await expect(card.getByRole('term')).toHaveText(labels)
        await expect(card.getByRole('definition')).toHaveText(descriptions)
        await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
        expect(await card.locator('dt, dd').evaluateAll(elements => elements.every(element => {
          const text = element.firstChild

          if (!text) throw new Error('Scope text is missing')
          const range = document.createRange()

          return [...element.textContent.matchAll(/[a-z]+/gi)].every(match => {
            range.setStart(text, match.index)
            range.setEnd(text, match.index + match[0].length)
            return range.getClientRects().length === 1
          })
        }))).toBe(true)
        expect(await card.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h2, dt, dd')].every(child => {
            const range = document.createRange()

            range.selectNodeContents(child)
            return [...range.getClientRects()].every(rect => !rect.width || (
              rect.left >= bounds.left && rect.right <= bounds.right &&
              rect.top >= bounds.top && rect.bottom <= bounds.bottom
            ))
          })
        })).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    })
  }

  test(`project focus remains passive and accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/portfolio/smith-commerce/')
    const card = page.getByRole('region', { name: 'Focus', exact: true })

    await card.scrollIntoViewIfNeeded()
    const appearance = () => card.evaluate(element => [element, ...element.querySelectorAll('*')].map(child => {
      const style = getComputedStyle(child)

      return [style.backgroundColor, style.color, style.transform, style.borderColor]
    }))
    const before = await appearance()

    await card.hover()
    expect(await appearance()).toEqual(before)
    const audit = await new AxeBuilder({ page }).include('[data-project-focus]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('scope ledger preserves the Focus fragment and complete content without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()

  try {
    await page.goto('/portfolio/smith-commerce/#sidebar-focus')
    const card = page.getByRole('region', { name: 'Focus', exact: true })

    await expect(card.getByRole('heading', { name: 'Focus' })).toBeInViewport()
    await expect(card.getByRole('term')).toHaveText(['Marcone', 'F.W. Webb', 'Shared foundations'])
    await expect(card.getByRole('definition')).toHaveCount(3)
    await expect(card.locator('a, button, [tabindex]')).toHaveCount(0)
  } finally {
    await context.close()
  }
})
