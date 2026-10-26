import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const article = '/blog/why-developer-experience-work-should-be-measured-like-product-work/'
const sectionTitle = 'What is worth measuring'
const sectionUrl = `https://santi020k.com${article}#what-is-worth-measuring`

test.use({ reducedMotion: 'reduce' })

test('section references copy their public fragment and preserve heading names', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (value: string) => {
        document.documentElement.dataset.copiedSection = value

        return Promise.resolve()
      } }
    })
  })
  await page.goto(article)
  const heading = page.getByRole('heading', { name: sectionTitle, exact: true })
  const copy = page.locator('[data-section-reference-row]').filter({ has: heading }).getByRole('button')

  await expect(heading).toHaveAttribute('id', 'what-is-worth-measuring')
  await expect(heading.locator('button')).toHaveCount(0)
  await copy.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-copied-section', sectionUrl)
  await expect(copy).toBeFocused()
  await expect(copy).toHaveAttribute('data-state', 'copied')
  await expect(copy.getByText('Copied', { exact: true })).toBeVisible()
  await expect(copy).toHaveAttribute('data-state', 'idle')
  await expect(copy).toHaveAccessibleName(`Copy link to section: ${sectionTitle}`)

  await page.locator('a[href="/blog/why-i-moved-to-zed/"]').first().click()
  await expect(page).toHaveURL('/blog/why-i-moved-to-zed/')
  const nextCopy = page.locator('[data-section-copy]').filter({ visible: true }).first()

  await nextCopy.click()
  await expect(page.locator('html')).toHaveAttribute('data-copied-section', /^https:\/\/santi020k\.com\/blog\/why-i-moved-to-zed\/#.+/u)
  await page.goBack()
  await expect(page).toHaveURL(article)
  await expect(page.getByRole('button', { name: `Copy link to section: ${sectionTitle}`, exact: true })).toHaveCount(1)
  await expect(heading).toHaveCount(1)
})

test('copy failures give feedback without changing the heading or destination', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('Clipboard permission denied')) }
    })
  })
  await page.goto(article)
  const copy = page.locator('[data-section-reference-row]').filter({ has: page.getByRole('heading', { name: sectionTitle, exact: true }) }).getByRole('button')

  await copy.click()
  await expect(copy).toHaveAttribute('data-state', 'error')
  await expect(copy.getByText('Copy failed', { exact: true })).toBeVisible()
  await expect(copy).toHaveAccessibleName(/Open this section from the contents and copy the address/u)
  await expect(page.getByRole('heading', { name: sectionTitle, exact: true })).toHaveCount(1)
  await expect(page).toHaveURL(article)
})

for (const theme of ['light', 'dark'] as const) {
  test(`section controls fit formatted headings in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/blog/migrate-eslint-8-or-less-to-eslint-9/')
    await page.evaluate(scheme => {
      document.documentElement.dataset.theme = scheme
    }, theme)
    const rows = page.locator('[data-section-reference-row]')

    expect(await rows.count()).toBeGreaterThan(0)
    for (const { width, textSize } of [
      { width: 320, textSize: 100 },
      { width: 390, textSize: 200 },
      { width: 1440, textSize: 100 }
    ]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, textSize)
      expect(await rows.evaluateAll(elements => elements.every(element => {
        const heading = element.querySelector('h2')?.getBoundingClientRect()
        const button = element.querySelector('button')?.getBoundingClientRect()

        return heading && button && button.width >= 44 && button.height >= 44 &&
          (button.left >= heading.right - 1 || button.top >= heading.bottom - 1) &&
          element.scrollWidth <= element.clientWidth + 1
      }))).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await expect(page.getByRole('heading', { name: '4. Use FlatCompat only as a transition layer', exact: true }).locator('code')).toHaveText('FlatCompat')
    const a11y = await new AxeBuilder({ page }).include('[data-section-reference-row]').analyze()

    expect(a11y.violations).toEqual([])
  })
}

test('MDX references use the local article fragments even for syndicated content', async ({ page }) => {
  await page.goto('/blog/atomic-module-component-structure-for-react/')
  const copies = page.locator('[data-section-reference-row] [data-section-copy]')

  expect(await copies.count()).toBeGreaterThan(0)
  expect(await copies.evaluateAll(elements => elements.every(element => element.getAttribute('data-copy-value')?.startsWith('https://santi020k.com/blog/atomic-module-component-structure-for-react/#')))).toBe(true)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('native headings and contents work without exposing inactive copy controls', async ({ page }) => {
    await page.goto(article)
    await expect(page.getByRole('button', { name: /Copy link to section/u })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: sectionTitle, exact: true })).toHaveAttribute('id', 'what-is-worth-measuring')
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole('link', { name: sectionTitle, exact: true }).filter({ visible: true }).click()
    await expect(page).toHaveURL(`${article}#what-is-worth-measuring`)
  })
})
