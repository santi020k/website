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
  await expect(copy).toHaveAccessibleName(`Copied link to section: ${sectionTitle}`)
  await expect(copy.getByText('Copied', { exact: true })).toBeVisible()
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

test('copy failures preserve the exact section address until a successful retry', async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (value: string) => {
        attempts += 1

        if (attempts === 1) return Promise.reject(new Error('Clipboard permission denied'))

        sessionStorage.setItem('section-link-copied', value)
        return Promise.resolve()
      } }
    })
  })
  await page.goto(`${article}?source=share#another-section`)
  await page.clock.install()
  const row = page.locator('[data-section-reference-row]').filter({ has: page.getByRole('heading', { name: sectionTitle, exact: true }) })
  const copy = row.getByRole('button')
  const address = row.getByRole('textbox', { name: 'Select and copy this section’s address' })
  const status = row.getByRole('status')

  await copy.focus()
  await copy.press('Enter')
  await expect(copy).toBeFocused()
  await expect(copy.getByText('Try again', { exact: true })).toBeVisible()
  await expect(copy).toHaveAccessibleName(`Try again to copy link to section: ${sectionTitle}`)
  await expect(address).toHaveValue(sectionUrl)
  await expect(address).toHaveAttribute('readonly')
  await page.clock.fastForward(2500)
  await expect(address).toBeVisible()
  await expect(status).toHaveText('Copy failed. Select and copy the address below, or try again.')
  await page.keyboard.press('Tab')
  await page.clock.runFor(20)
  await expect(address).toBeFocused()
  expect(await address.evaluate(element => {
    if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected section address')

    return element.selectionStart === 0 && element.selectionEnd === element.value.length
  })).toBe(true)
  await page.emulateMedia({ media: 'print' })
  await expect(address).toBeHidden()
  await page.emulateMedia({ media: 'screen' })
  await copy.click()
  await expect(address).toBeHidden()
  await expect(copy).not.toHaveAttribute('aria-describedby')
  await expect(copy).toHaveAccessibleName(`Copied link to section: ${sectionTitle}`)
  expect(await page.evaluate(() => sessionStorage.getItem('section-link-copied'))).toBe(sectionUrl)
  await page.clock.fastForward(2500)
  await expect(copy).toHaveAccessibleName(`Copy link to section: ${sectionTitle}`)
  await expect(copy.locator('[data-section-copy-feedback]')).toBeHidden()
  await expect(page.getByRole('heading', { name: sectionTitle, exact: true })).toHaveCount(1)
  await expect(page).toHaveURL(`${article}?source=share#another-section`)
})

for (const theme of ['light', 'dark'] as const) {
  test(`section controls fit formatted headings in ${theme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    const errors: string[] = []

    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
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
      const row = rows.first()

      await row.getByRole('button').click()
      await expect(row.getByRole('textbox')).toBeVisible()
      await expect.poll(() => row.evaluate(element => {
        const address = element.querySelector('textarea')

        return address !== null && address.scrollHeight <= address.clientHeight + 2 &&
          element.scrollWidth <= element.clientWidth + 1
      })).toBe(true)
    }
    await expect(page.getByRole('heading', { name: '4. Use FlatCompat only as a transition layer', exact: true }).locator('code')).toHaveText('FlatCompat')
    const a11y = await new AxeBuilder({ page }).include('[data-section-reference-row]').analyze()

    expect(a11y.violations).toEqual([])
    expect(errors).toEqual([])
  })
}

test('separate section failures retain their own address and announce repeated attempts', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }))
  await page.goto(article)
  await page.clock.install()
  const rows = page.locator('[data-section-reference-row]')
  const first = rows.nth(0)
  const second = rows.nth(1)

  for (const row of [first, second]) {
    await row.getByRole('button').click()
    await page.clock.fastForward(100)
    await expect(row.getByRole('status')).not.toBeEmpty()
    const slug = await row.getByRole('heading').getAttribute('id') ?? ''

    expect(slug).not.toBe('')

    await expect(row.getByRole('textbox')).toHaveValue(`https://santi020k.com${article}#${slug}`)
  }
  await first.getByRole('button').click()
  await expect(first.getByRole('status')).toBeEmpty()
  await page.clock.fastForward(100)
  await expect(first.getByRole('status')).not.toBeEmpty()
  await expect(second.getByRole('textbox')).toBeVisible()
})

test('MDX references use the local article fragments even for syndicated content', async ({ page }) => {
  await page.goto('/blog/atomic-module-component-structure-for-react/')
  const copies = page.locator('[data-section-reference-row] [data-section-copy]')

  expect(await copies.count()).toBeGreaterThan(0)
  expect(await copies.evaluateAll(elements => elements.every(element => element.getAttribute('data-share-url')?.startsWith('https://santi020k.com/blog/atomic-module-component-structure-for-react/#')))).toBe(true)
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
