import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const labels = ['React.js', 'Next.js', 'React Native', 'Astro', 'TypeScript', 'Tailwind CSS', 'Redux', 'TanStack Query', 'Radix UI', 'Node.js', 'Express.js', 'NestJS', 'REST', 'GraphQL', 'PostgreSQL', 'MongoDB', 'PHP', 'Ruby on Rails', 'AWS', 'Docker', 'CI/CD', 'GitHub Actions', 'System Design', 'Microservices', 'Turborepo']

for (const theme of ['light', 'dark'] as const) {
  test(`Linked skills preserve the capability ledger in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/resume/')
    const skills = page.locator('[data-resume-skills]')
    const links = skills.getByRole('link')

    await expect(links).toHaveText(labels)
    await expect(skills.getByRole('list')).toHaveCount(3)
    await expect(skills.getByText('Spanish (native), English (C1).')).toBeVisible()
    await expect(skills.getByRole('link', { name: 'REST', exact: true })).toHaveAttribute('href', '/technologies/rest-apis/')
    await links.first().focus()
    for (const link of await links.all()) {
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    }
    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        const overflowing = await skills.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('h3, p, a')].filter(copy => {
            const range = document.createRange()

            range.selectNodeContents(copy)
            return [...range.getClientRects()].some(rect => rect.width > 0 && (
              rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
            ))
          }).map(copy => copy.textContent)
        })

        expect(overflowing, `Skills must fit at ${width}px and ${size}%`).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        for (const link of await links.all()) {
          expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
        }
      }
    }
    const audit = await new AxeBuilder({ page }).include('#resume-skills').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Every linked skill reaches its technology archive without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
  const page = await context.newPage()

  for (const label of labels) {
    await page.goto('/resume/')
    const link = page.locator('[data-resume-skills]').getByRole('link', { name: label, exact: true })
    const href = await link.getAttribute('href')

    await link.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => new URL(page.url()).pathname).toBe(href)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(label === 'REST' ? 'REST APIs' : label)
  }
  await context.close()
})

test('Both resume print variants retain the original skill paragraphs', async ({ page }) => {
  await page.goto('/resume/')
  await page.emulateMedia({ media: 'print' })
  const skills = page.locator('[data-resume-skills]')

  for (const variant of ['short', 'full']) {
    await page.evaluate(value => {
      document.documentElement.dataset.resumeVariant = value
    }, variant)
    await expect(skills.getByRole('link')).toHaveCount(0)
    await expect(skills.getByRole('paragraph')).toHaveText([
      'Spanish (native), English (C1).',
      'React.js, Next.js, React Native, Astro, TypeScript, Tailwind CSS, Redux, TanStack Query, Radix UI.',
      'Node.js, Express.js, NestJS, REST, GraphQL, PostgreSQL, MongoDB, PHP, Ruby on Rails.',
      'AWS, Docker, CI/CD, GitHub Actions, System Design, Microservices, Turborepo.'
    ])
    expect(await skills.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  }
})
