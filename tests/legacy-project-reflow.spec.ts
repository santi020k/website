import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Locator, type Page, test } from '@playwright/test'

const setReadingPreferences = async (page: Page, width: number, textSize: number, theme: 'dark' | 'light') => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  await page.addInitScript(size => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.fontSize = `${Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * size / 100}px`
    })
  }, textSize)
}

const expectCopyFits = async (root: Locator) => {
  const clipped = await root.evaluateAll(elements => elements.flatMap(element => {
    const failures: string[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()

    while (node) {
      const parent = node.parentElement
      const text = node.textContent?.trim()

      const visuallyHidden = parent && getComputedStyle(parent).clipPath === 'inset(50%)'

      if (text && parent?.checkVisibility() && !visuallyHidden && !parent.closest('script, style, .sr-only, .ui-sr-only, [hidden]')) {
        const range = document.createRange()

        range.selectNodeContents(node)
        const bounds = [{ left: 0, right: innerWidth }]
        let ancestor: Element | null = parent

        while (ancestor) {
          const style = getComputedStyle(ancestor)

          if (['hidden', 'clip'].includes(style.overflowX)) {
            const rect = ancestor.getBoundingClientRect()

            bounds.push({ left: rect.left, right: rect.right })
          }
          ancestor = ancestor.parentElement
        }
        const outsideBounds = [...range.getClientRects()].some(rect => rect.width > 0 && bounds.some(
          bound => rect.left < bound.left - 1 || rect.right > bound.right + 1
        ))

        if (outsideBounds) {
          failures.push(text)
        }
      }
      node = walker.nextNode()
    }
    return failures
  }))

  expect(clipped).toEqual([])
}

for (const width of [390, 1440]) {
  for (const textSize of [100, 200]) {
    for (const theme of ['light', 'dark'] as const) {
      test(`archive project labels and copy fit at ${width}px / ${textSize}% / ${theme}`, async ({ page }) => {
        await setReadingPreferences(page, width, textSize, theme)
        await page.goto('/v1/portfolio/optic-power/')
        await page.evaluate(() => document.fonts.ready)
        const technology = page.locator('main a[href*="/technologies/"]')

        await expectCopyFits(technology)
        await expect(page.getByRole('link', { name: 'View all projects with the technology: Semantic HTML & CSS', exact: true })).toHaveCount(1)
        const badgeColors = await technology.first().locator('div').evaluate(element => getComputedStyle(element).backgroundColor)

        expect(badgeColors).not.toBe('rgba(0, 0, 0, 0)')
        const badgeScan = await new AxeBuilder({ page }).include('main a[href*="/technologies/"]').analyze()

        expect(badgeScan.violations).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

        await page.goto('/v3/portfolio/lumen-ui/')
        await page.evaluate(() => document.fonts.ready)
        await expectCopyFits(page.locator('#technologies, .prose-project, [aria-labelledby="sidebar-glance"], [data-slot="eyebrow"]'))
        await expectCopyFits(page.getByRole('link', { name: 'Browse all projects', exact: true }))
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      })

      for (const era of ['v2', 'v3']) {
        test(`${era} header controls fit at ${width}px / ${textSize}% / ${theme}`, async ({ page }) => {
          await setReadingPreferences(page, width, textSize, theme)
          await page.goto(`/${era}/portfolio/optic-power/`)
          await page.evaluate(() => document.fonts.ready)
          const clipped = await page.locator('[data-header-shell] :is(a[href], button)').evaluateAll(elements => elements.filter(element => element.checkVisibility()).flatMap(element => {
            const rect = element.getBoundingClientRect()

            return rect.left < -1 || rect.right > innerWidth + 1 ? [element.getAttribute('aria-label') ?? element.textContent.trim()] : []
          }))

          expect(clipped).toEqual([])
          await expectCopyFits(page.locator('[data-header-shell]'))
        })
      }
    }
  }
}

for (const era of ['v2', 'v3']) {
  test(`${era} enlarged mobile header supports menu, search and dismissal`, async ({ page }) => {
    await setReadingPreferences(page, 390, 200, 'light')
    await page.goto(`/${era}/portfolio/optic-power/`)
    const toggle = page.locator('[data-mobile-nav-toggle]')
    const search = page.locator('[data-site-search-trigger]')

    await expect(toggle).toHaveAccessibleName(/menu.*navigation/i)
    const header = await page.locator('[data-header-shell]').boundingBox()
    const control = await toggle.boundingBox()

    expect(header?.height).toBeLessThan(180)
    expect(control?.width).toBeGreaterThanOrEqual(44)
    expect(control?.height).toBeGreaterThanOrEqual(44)

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await search.click()
    await expect(page.locator('#site-search-input')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(search).toBeFocused()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })
}

for (const project of [
  { slug: 'eslint-config-santi020k', label: 'Jan 2023 - Mar 2024', dates: ['2023-01', '2024-03'] },
  { slug: 'lumen-ui', label: 'Jul 2026 - Present', dates: ['2026-07'] }
]) {
  test(`current ${project.slug} timeline exposes individual dates and sidebar headings`, async ({ page }) => {
    await page.goto(`/portfolio/${project.slug}/`)
    const hero = page.locator('[data-project-meta]').filter({ has: page.getByText('Timeline', { exact: true }) }).locator('dd')
    await expect(hero).toHaveText(project.label)
    expect(await hero.locator('time').evaluateAll(elements => elements.map(element => element.getAttribute('datetime')))).toEqual(project.dates)
    await expect(page.getByRole('region', { name: 'At a glance', exact: true })).toHaveCount(0)
    const details = page.getByRole('complementary', { name: 'Project details' })

    await expect(details.getByRole('heading', { level: 2, name: 'Focus', exact: true })).toBeVisible()
    await expect(details.getByRole('heading', { name: 'Core stack', exact: true })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Stack', exact: true })).toHaveCount(1)
  })
}
