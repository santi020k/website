import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/testing-react-components-with-vitest-and-react-testing-library/'
const syncedArticle = '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/'
const nextTab = (browserName: string) => browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab'

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (value: string) => {
          if (sessionStorage.getItem('tab-copy-outcome') !== 'resolve') {
            return Promise.reject(new DOMException('Clipboard denied for fixture', 'NotAllowedError'))
          }
          sessionStorage.setItem('tab-copy-value', value)
          return Promise.resolve()
        }
      }
    })
  })
})

for (const locale of ['en', 'es']) {
  test(`${locale} selects the complete active command after denial and clears recovery on retry`, async ({ page, browserName }) => {
    await page.goto(`${locale === 'es' ? '/es' : ''}${article}`)
    const group = page.locator('[data-package-manager-code-tabs]').first()
    await group.getByRole('tab', { name: 'pnpm', exact: true }).click()
    const panel = group.getByRole('tabpanel')
    const copy = panel.locator('[data-ui-code-copy]')
    const pre = panel.locator('pre')
    const source = await pre.innerText()
    await page.clock.install()
    await copy.click()
    await expect(panel.locator('[data-code-recovery]')).toBeVisible()
    await expect(copy).toHaveAttribute('data-state', 'error')
    await page.clock.fastForward(5000)
    await expect(copy).toHaveAttribute('data-state', 'idle')
    await copy.press(nextTab(browserName))
    const select = panel.getByRole('button', { name: locale === 'es' ? 'Seleccionar código' : 'Select code', exact: true })
    await expect(select).toBeFocused()
    await expect(select).toHaveCSS('outline-style', 'solid')
    await select.press('Enter')
    await expect(pre).toBeFocused()
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(source)
    await expect(panel.getByRole('status')).toHaveText(locale === 'es' ?
      'Código seleccionado. Usa el teclado o el menú de tu dispositivo para copiarlo.' :
      'Code selected. Use your keyboard or device menu to copy.')
    expect(await pre.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(96)
    await pre.press(nextTab(browserName))
    await expect(pre).not.toBeFocused()
    await page.evaluate(() => {
      sessionStorage.setItem('tab-copy-outcome', 'resolve')
    })
    await copy.click()
    await expect(copy).toHaveAttribute('data-state', 'copied')
    await expect(group.locator('[data-code-recovery]')).toHaveCount(0)
    expect(await page.evaluate(() => sessionStorage.getItem('tab-copy-value'))).toBe(source)
  })
}

test('switching managers clears recovery in both synchronized groups and retains keyboard navigation', async ({ page }) => {
  await page.goto(syncedArticle)
  const groups = page.locator('[data-package-manager-code-tabs]')
  await expect(groups).toHaveCount(2)
  await groups.first().getByRole('tab', { name: 'pnpm', exact: true }).click()
  for (const group of await groups.all()) {
    await group.getByRole('tabpanel').locator('[data-ui-code-copy]').click()
    await expect(group.locator('[data-code-recovery]')).toBeVisible()
  }
  const tab = groups.last().getByRole('tab', { name: 'pnpm', exact: true })
  await tab.press('ArrowRight')
  await expect(groups.last().getByRole('tab', { name: 'Bun', exact: true })).toBeFocused()
  await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
  for (const group of await groups.all()) await expect(group.getByRole('tabpanel')).toHaveAttribute('data-value', 'bun')
  await groups.last().getByRole('tabpanel').locator('[data-ui-code-copy]').click()
  await groups.last().getByRole('button', { name: 'Select code', exact: true }).click()
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(await groups.last().getByRole('tabpanel').locator('pre').innerText())
  await page.reload()
  await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
  for (const group of await groups.all()) await expect(group.getByRole('tabpanel')).toHaveAttribute('data-value', 'bun')
})

test('a delayed clipboard denial cannot add recovery to a hidden command', async ({ page }) => {
  await page.goto(article)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => new Promise<void>((_resolve, reject) => {
      document.addEventListener('test:deny-copy', () => {
        reject(new Error('Delayed fixture denial'))
      }, { once: true })
    }) }
  }))
  const group = page.locator('[data-package-manager-code-tabs]').first()
  const firstCopy = group.getByRole('tabpanel').locator('[data-ui-code-copy]')
  const oldPanel = group.locator('[role="tabpanel"][data-value="npm"]')
  await firstCopy.click()
  await group.getByRole('tab', { name: 'pnpm', exact: true }).click()
  await page.evaluate(() => document.dispatchEvent(new Event('test:deny-copy')))
  await expect(oldPanel.locator('[data-ui-code-copy]')).toHaveAttribute('data-state', 'error')
  await expect(group.locator('[data-code-recovery]')).toHaveCount(0)
})

for (const theme of ['light', 'dark'] as const) {
  test(`recovery fits mobile and enlarged text and remains accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(article)
    const group = page.locator('[data-package-manager-code-tabs]').first()
    await group.getByRole('tabpanel').locator('[data-ui-code-copy]').click()
    const recovery = group.locator('[data-code-recovery]')
    const pre = group.getByRole('tabpanel').locator('pre')
    await expect(recovery).toBeVisible()
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const size of ['100%', '200%']) {
        await page.evaluate(value => {
          document.documentElement.style.fontSize = value
        }, size)
        const row = await recovery.boundingBox()
        const code = await pre.boundingBox()
        expect(row).not.toBeNull()
        expect(code).not.toBeNull()
        expect((row?.y ?? 0) + (row?.height ?? 0)).toBeLessThanOrEqual((code?.y ?? 0) + 1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '100%'
    })
    expect((await new AxeBuilder({ page }).include('[data-package-manager-code-tabs]').analyze()).violations).toEqual([])
    await page.emulateMedia({ media: 'print' })
    await expect(recovery).toBeHidden()
    await expect(pre).toBeVisible()
  })
}

test('missing clipboard support and repeated Astro visits retain one working recovery action', async ({ page }) => {
  await page.goto(article)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
  const group = page.locator('[data-package-manager-code-tabs]').first()
  await group.getByRole('tabpanel').locator('[data-ui-code-copy]').click()
  await expect(group.locator('[data-code-recovery]')).toBeVisible()
  await page.locator('[data-return-link]').click()
  await expect(page).toHaveURL('/blog/')
  await page.goBack()
  await expect(page).toHaveURL(article)
  await expect(page.locator('#nav-progress')).toHaveClass(/is-complete/u)
  await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')))
  await group.getByRole('tabpanel').locator('[data-ui-code-copy]').click()
  await expect(group.locator('[data-code-recovery]')).toHaveCount(1)
  await group.getByRole('button', { name: 'Select code', exact: true }).click()
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(await group.getByRole('tabpanel').locator('pre').innerText())
})

test('without JavaScript every command remains readable and no recovery control is added', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(article)
  const group = page.locator('[data-package-manager-code-tabs]').first()
  await expect(group.locator('pre:visible')).toHaveCount(4)
  await expect(page.locator('[data-code-recovery]')).toHaveCount(0)
  await context.close()
})
