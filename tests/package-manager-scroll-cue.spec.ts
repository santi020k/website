import { expect, test } from '@playwright/test'

const article = '/blog/testing-react-components-with-vitest-and-react-testing-library/'
const storybook = '/blog/storybook-in-action-with-next-js-tailwind-and-typescript/'

test.use({ reducedMotion: 'reduce' })

for (const locale of ['en', 'es']) {
  const label = locale === 'es' ? 'Desplázate horizontalmente para leer más' : 'Scroll horizontally to read more'
  const route = `${locale === 'es' ? '/es' : ''}${article}`

  test(`${locale} keeps the approved cue outside the active command through tab changes and resizing`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const group = page.locator('[data-package-manager-code-tabs]').first()
    const panel = group.getByRole('tabpanel')
    const cue = panel.locator('[data-scroll-cue-message]')
    const pre = panel.locator('pre')

    for (const manager of ['pnpm', 'Bun', 'npm', 'yarn']) {
      await group.getByRole('tab', { name: manager, exact: true }).click()
      await expect(cue).toBeVisible()
      await expect(pre).toHaveAccessibleDescription(label)
      expect(await cue.evaluate(element => {
        const command = element.parentElement?.querySelector('pre')
        return Boolean(command && element.getBoundingClientRect().top >= command.getBoundingClientRect().bottom - 1)
      })).toBe(true)
      await expect(group.locator('[role="tabpanel"][hidden] [data-scroll-cue-message]:not([hidden])')).toHaveCount(0)
    }
    const original = await pre.innerText()
    await pre.focus()
    await page.keyboard.press('ArrowRight', { delay: 100 })
    await expect.poll(() => pre.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    await expect(pre).toBeFocused()
    await page.setViewportSize({ width: 1440, height: 1000 })
    // This install command still overflows the desktop reading column.
    await expect(cue).toBeVisible()
    await expect(pre).toHaveAccessibleDescription(label)
    await page.setViewportSize({ width: 320, height: 900 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await expect(cue).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(pre).toHaveText(original)
    await page.emulateMedia({ media: 'print' })
    await expect(cue).toBeHidden()
  })
}

test('short commands stay quiet while synchronized overflowing commands retain guidance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(storybook)
  const groups = page.locator('[data-package-manager-code-tabs]')
  await expect(groups).toHaveCount(2)
  await groups.first().getByRole('tab', { name: 'Bun', exact: true }).click()
  await expect(groups.first().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeHidden()
  await expect(groups.last().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeVisible()
  await page.setViewportSize({ width: 320, height: 900 })
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  await expect(groups.first().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeVisible()
  await page.evaluate(() => {
    document.documentElement.style.fontSize = ''
  })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(groups.first().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeHidden()
  await expect(groups.first().getByRole('tabpanel').locator('pre')).not.toHaveAttribute('aria-describedby')
  await page.setViewportSize({ width: 390, height: 900 })
  await page.reload()
  for (const group of await groups.all()) await expect(group.getByRole('tabpanel')).toHaveAttribute('data-value', 'bun')
  await expect(groups.last().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeVisible()
  await page.getByRole('navigation', { name: 'Page-end navigation', exact: true }).getByRole('link', { name: 'Back to Blog', exact: true }).click()
  await expect(page).toHaveURL(/\/blog\/$/u)
  await page.goBack()
  await expect(groups.last().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toBeVisible()
  await expect(groups.last().getByRole('tabpanel').locator('[data-scroll-cue-message]')).toHaveCount(1)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('leaves all commands readable without an unmeasured cue', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto(article)
    const group = page.locator('[data-package-manager-code-tabs]').first()
    await expect(group.locator('pre:visible')).toHaveCount(4)
    await expect(group.locator('[data-scroll-cue-message]:visible')).toHaveCount(0)
    await expect(group.locator('pre[aria-describedby]')).toHaveCount(0)
  })
})
