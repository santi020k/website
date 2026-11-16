import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('Archive cards put the selected technology first without duplicate aliases', async ({ page }) => {
  for (const slug of ['typescript', 'react-js', 'ci-cd', 'model-context-protocol']) {
    await page.goto(`/technologies/${slug}/`)
    const technology = (await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s*In practice\.\s*$/u, '').trim()
    const cards = page.locator('[data-project-gallery-card]')

    expect(await cards.count()).toBeGreaterThan(0)
    for (const card of await cards.all()) {
      const technologies = card.getByRole('list').getByRole('listitem')

      await expect(card.locator('[data-technology-match]')).toHaveCount(1)
      await expect(technologies.first()).toHaveAttribute('data-technology-match', '')
      await expect(technologies.first()).toHaveText(`Archive match: ${technology}`)
      expect(await technologies.count()).toBeLessThanOrEqual(3)
      const labels = (await technologies.allTextContents()).map(text => text.replace('Archive match:', '').trim().toLowerCase().replace(/[^a-z0-9]/gu, ''))

      expect(new Set(labels).size).toBe(labels.length)
      await expect(card.getByRole('link')).toHaveCount(1)
    }
  }
})

for (const theme of ['light', 'dark'] as const) {
  test(`Matched stack remains readable and keyboard usable in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/model-context-protocol/')
    const card = page.locator('[data-project-gallery-card]').first()

    for (const width of [320, 390, 768, 1440]) {
      for (const size of [100, 200]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.evaluate(async value => {
          document.documentElement.style.fontSize = `${value}%`
          await document.fonts.ready
        }, size)
        const stack = card.locator('[data-matched-stack]')
        const overflow = await stack.evaluate(element => {
          const bounds = element.getBoundingClientRect()

          return [...element.querySelectorAll('li')].filter(label => {
            const box = label.getBoundingClientRect()

            return box.left < bounds.left - 1 || box.right > bounds.right + 1 ||
              label.scrollWidth > label.clientWidth + 1
          }).map(label => label.textContent)
        })

        expect(overflow, `Stack must fit at ${width}px and ${size}%`).toEqual([])
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      }
    }
    const link = card.getByRole('link')

    await link.focus()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await expect(link).toHaveAccessibleName(/Lumen UI.*Archive match: Model Context Protocol/u)
    const audit = await new AxeBuilder({ page }).include('[data-project-gallery-card]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Matched stack changes only the archive representation of a project', async ({ page }) => {
  await page.goto('/technologies/typescript/')
  const lumen = page.locator('[data-project-gallery-card]').filter({ has: page.getByRole('heading', { name: 'Lumen UI', exact: true }) })

  await expect(lumen.getByRole('listitem')).toHaveText(['Archive match: TypeScript', 'Astro', 'React.js'])
  await page.goto('/projects/')
  await expect(page.locator('[data-technology-match]')).toHaveCount(0)
  await expect(lumen.getByRole('listitem')).toHaveText(['Astro', 'React.js', 'Web Components'])
})

test('Matched archive cards retain their native destination without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })

  try {
    const page = await context.newPage()

    await page.goto('/technologies/typescript/')
    const lumen = page.locator('[data-project-gallery-card]').filter({ has: page.getByRole('heading', { name: 'Lumen UI', exact: true }) })
    const link = lumen.getByRole('link')

    await expect(lumen.locator('[data-technology-match]')).toHaveText('Archive match: TypeScript')
    await expect(link).toHaveAttribute('href', '/portfolio/lumen-ui/')
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/portfolio\/lumen-ui\/$/u)
  } finally {
    await context.close()
  }
})
