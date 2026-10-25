import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const lanes = [
  { name: 'Web foundations', technologies: ['React.js', 'Next.js', 'TypeScript'] },
  { name: 'Mobile', technologies: ['React Native', 'Expo'] },
  { name: 'Data & state', technologies: ['Node.js', 'GraphQL', 'Apollo Client', 'TanStack Query', 'OpenAPI', 'Zustand', 'Redux Toolkit', 'Redux Sagas', 'Redux'] },
  { name: 'UI systems', technologies: ['Storybook', 'Tailwind CSS', 'Radix UI', 'Mantine UI'] }
]

for (const theme of ['light', 'dark'] as const) {
  test(`toolkit lanes preserve readable groups and technology links in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/work/')
    const toolkit = page.getByRole('region', { name: 'The tools behind the work.' })

    for (const lane of lanes) {
      const group = toolkit.getByRole('region', { name: lane.name, exact: true })

      await expect(group.getByRole('heading', { level: 3 })).toHaveText(lane.name)
      await expect(group.locator('[data-sculpted-tag-label]')).toHaveText(lane.technologies)
      for (const link of await group.getByRole('link').all()) {
        await expect(link).toHaveAttribute('href', /^\/technologies\/[^/]+\/$/u)
        await expect(link.locator('[data-sculpted-tag-count]')).toHaveText(/^[1-9]\d*$/u)
      }
    }
    const links = toolkit.locator('[data-sculpted-tag]')

    await expect(links).toHaveCount(18)
    await expect(toolkit.getByRole('link', { name: /^Explore \d+ more$/u })).toHaveAttribute('href', '/technologies/')
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async textSize => {
          document.documentElement.style.fontSize = `${textSize}%`
          await document.fonts.ready
        }, size)
        const clipped = await toolkit.evaluate(section => [...section.querySelectorAll('h2, h3, p, a')].filter(element => {
          const bounds = element.getBoundingClientRect()

          return bounds.left < -1 || bounds.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1
        }).map(element => element.textContent))

        expect(clipped, `Toolkit must fit at ${width}px and ${size}%`).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    await links.first().focus()
    await expect(links.first()).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Tab')
    await expect(links.nth(1)).toBeFocused()
    const audit = await new AxeBuilder({ page }).include('[data-work-stack]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('toolkit links reach their technology archive without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()

  await page.goto('/work/')
  const links = page.locator('[data-work-stack] [data-sculpted-tag]')

  await expect(links).toHaveCount(18)
  await links.first().focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/technologies\/react-js\/$/u)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('React.js')
  await context.close()
})
