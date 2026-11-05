import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('Stack connections link to related archives using shared-entry counts', async ({ page }) => {
  await page.goto('/technologies/react-js/')
  const ending = page.getByRole('region', { name: 'Used alongside React.js' })
  const connections = ending.getByRole('list').getByRole('link')

  await expect(ending).toContainText('Other technologies listed in these 12 entries.')
  await expect(connections).toHaveText([
    'TypeScript11 shared entries',
    'JavaScript9 shared entries',
    'ESLint8 shared entries',
    'Next.js8 shared entries',
    'CI/CD7 shared entries',
    'Developer Experience (DX)7 shared entries'
  ])
  const paths = await connections.evaluateAll(links => links.map(link => link.getAttribute('href')))

  expect(paths).toEqual([
    '/technologies/typescript/',
    '/technologies/javascript/',
    '/technologies/eslint/',
    '/technologies/next-js/',
    '/technologies/ci-cd/',
    '/technologies/developer-experience-dx/'
  ])
  for (const link of await connections.all()) {
    const path = await link.getAttribute('href') ?? ''
    const response = await page.request.get(path)

    expect(response.status()).toBe(200)
  }
  await page.goto('/technologies/model-context-protocol/')
  await expect(page.locator('[data-stack-connections-description]')).toHaveText('Other technologies listed in this entry.')
  await expect(page.locator('[data-stack-connection-count]')).toHaveText(Array.from({ length: 6 }, () => '1 shared entry'))
})

for (const theme of ['light', 'dark'] as const) {
  test(`Stack connections remain readable and keyboard usable in ${theme}`, async ({ page, browserName }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/technologies/react-js/#stack-connections-heading')
    const ending = page.locator('[data-stack-connections]')
    const links = ending.getByRole('link')

    await links.first().focus()
    for (const link of await links.all()) {
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    }
    for (const slug of ['react-js', 'model-context-protocol']) {
      await page.goto(`/technologies/${slug}/#stack-connections-heading`)
      for (const width of [320, 390, 768, 1440]) {
        for (const size of [100, 200]) {
          await page.setViewportSize({ width, height: 1000 })
          await page.evaluate(async value => {
            document.documentElement.style.fontSize = `${value}%`
            await document.fonts.ready
          }, size)
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
          const clipped = await ending.evaluate(element => {
            const bounds = element.getBoundingClientRect()

            return [...element.querySelectorAll('h2, p, a')].filter(copy => {
              const range = document.createRange()

              range.selectNodeContents(copy)
              return [...range.getClientRects()].some(rect => rect.width > 0 && (
                rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.bottom > bounds.bottom + 1
              ))
            }).map(copy => copy.textContent)
          })

          expect(clipped, `${slug} at ${width}px and ${size}% text`).toEqual([])
        }
      }
    }
    const audit = await new AxeBuilder({ page }).include('[data-stack-connections]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()

    expect(audit.violations).toEqual([])
  })
}

test('Stack connections work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })

  try {
    const page = await context.newPage()

    await page.goto('/technologies/react-js/#stack-connections-heading')
    const ending = page.getByRole('region', { name: 'Used alongside React.js' })

    await ending.getByRole('link', { name: 'TypeScript 11 shared entries' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/technologies\/typescript\/$/u)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('TypeScript In practice.')
  } finally {
    await context.close()
  }
})
