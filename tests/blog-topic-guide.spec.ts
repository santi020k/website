import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from './helpers/accessibility'
import { requireValue } from './helpers/assertions'

for (const theme of ['light', 'dark']) {
  test(`Topic guide gives stable hover and keyboard feedback in ${theme}`, async ({ page, browserName }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/blog/')
    await page.evaluate(() => document.fonts.ready)
    const guide = page.locator('[data-blog-topic-guide]')
    const filter = guide.getByRole('group', { name: 'Filter by topic' })
    const topic = filter.getByRole('link', { name: /TypeScript/u })
    const count = topic.locator('[data-sculpted-tag-count]')
    await guide.scrollIntoViewIfNeeded()
    const restingBounds = await topic.boundingBox()
    const restingCount = await count.evaluate(element => getComputedStyle(element).backgroundColor)

    await topic.hover()
    await expect(count).not.toHaveCSS('background-color', restingCount)
    await expect(topic).not.toHaveCSS('box-shadow', 'none')
    await expect(topic.locator('[data-sculpted-tag-label]')).toHaveCSS('text-decoration-line', 'underline')
    await expect(topic).toHaveCSS('transform', 'none')
    expect(await topic.boundingBox()).toEqual(restingBounds)
    await expect.poll(() => topic.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
    const hoverCount = await count.evaluate(element => getComputedStyle(element).backgroundColor)
    const hoverAppearance = await topic.evaluate(element => ({
      background: getComputedStyle(element).backgroundColor,
      shadow: getComputedStyle(element).boxShadow
    }))
    const edges = await topic.evaluate(element => {
      const box = element.getBoundingClientRect()
      return [{ x: box.right - 1, y: box.top + box.height / 2 }, { x: box.left + box.width / 2, y: box.bottom - 1 }]
        .map(point => document.elementFromPoint(point.x, point.y)?.closest('a') === element)
    })
    expect(edges).toEqual([true, true])
    await expectNoUnexpectedAccessibilityViolations(page)

    await guide.locator('[data-topic-guide-heading]').hover()
    await filter.locator('a[href="/blog/tags/react/"]').focus()
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab')
    await expect(topic).toBeFocused()
    await expect(topic).toHaveCSS('outline-style', 'solid')
    await expect(count).toHaveCSS('background-color', hoverCount)
    await expect(topic).toHaveCSS('background-color', hoverAppearance.background)
    await expect(topic).toHaveCSS('box-shadow', hoverAppearance.shadow)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(topic).toHaveCSS('transition-property', 'none')
    await expect(count).toHaveCSS('transition-property', 'none')
    await expect(topic).toHaveCSS('transform', 'none')
    const selected = filter.getByRole('link', { name: 'All posts', exact: true })
    const selectedSurface = await selected.evaluate(element => getComputedStyle(element).backgroundColor)
    await selected.hover()
    await expect(selected).toHaveCSS('background-color', selectedSurface)
    await expect(selected).toHaveAttribute('aria-current', 'page')
  })

  test(`Topic guide wraps with enlarged text and links to the complete catalog in ${theme}`, async ({ page }) => {
    await page.addInitScript(value => {
      localStorage.setItem('theme', value)
    }, theme)
    await page.goto('/blog/')
    const guide = page.locator('[data-blog-topic-guide]')
    const catalog = guide.getByRole('link', { name: /^All \d+ topics$/u })
    await expect(catalog).toHaveAttribute('href', '/blog/tags/')
    await expect(catalog).not.toHaveAttribute('target', '_blank')
    await expect(guide.locator('[data-sculpted-tag-label]')).toHaveText([
      'All posts', 'Gaming', 'Reading', 'Developer experience', 'TypeScript', 'React', 'Next.js', 'Open source', 'ESLint'
    ])
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const geometry = await guide.getByRole('link').evaluateAll(links => links.map(link => {
          const rect = link.getBoundingClientRect()
          return {
            height: rect.height,
            fits: link.scrollWidth <= link.clientWidth + 1 && rect.left >= 0 && rect.right <= innerWidth + 1
          }
        }))
        expect(geometry.every(link => link.height >= 44 && link.fits)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
    }
    await catalog.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/$/u)
  })
}

test.describe('Topic guide without JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  test('readable topic links retain their slug destinations and counts', async ({ page }) => {
    await page.goto('/blog/')
    const guide = page.locator('[data-blog-topic-guide]')
    const topic = guide.getByRole('link', { name: /Developer experience/u })
    await expect(topic).toHaveAttribute('href', '/blog/tags/developer-experience/')
    const count = requireValue(await topic.locator('[data-sculpted-tag-count]').textContent()).trim()
    await topic.press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/developer-experience\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Developer experience')
    await expect(page.locator('[data-topic-archive-count]')).toHaveText(`${count} posts`)
    await expect(guide.getByRole('navigation', { name: 'Related topics' })).toBeVisible()
    await guide.getByRole('link', { name: /^All \d+ topics$/u }).press('Enter')
    await expect(page).toHaveURL(/\/blog\/tags\/$/u)
  })
})
