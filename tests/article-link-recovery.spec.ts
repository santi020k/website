import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const series = '/blog/playwright-accessibility-checks-that-teams-keep-running/'
const standalone = '/blog/building-roadscore-offline-road-trip-game/'
const project = '/portfolio/smith-commerce/'
const cases = [
  { name: 'series closing', path: series, button: 'copy-link-btn', success: 'Link copied!' },
  { name: 'standalone closing', path: standalone, button: 'copy-link-btn', success: 'Link copied!' },
  { name: 'syndicated series closing', path: '/blog/atomic-module-component-structure-for-react/', button: 'copy-link-btn', success: 'Link copied!' },
  { name: 'syndicated standalone closing', path: '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/', button: 'copy-link-btn', success: 'Link copied!' },
  { name: 'shared project closing', path: project, button: 'copy-link-btn', success: 'Link copied!' }
]

test.use({ reducedMotion: 'reduce' })

for (const item of cases) {
  test(`${item.name} keeps the clean address available until retry succeeds`, async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      let attempts = 0

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (value: string) => {
            attempts += 1

            if (attempts === 1) return Promise.reject(new DOMException('Synthetic denial', 'NotAllowedError'))

            sessionStorage.setItem('link-recovery-copy', value)
            return Promise.resolve()
          }
        }
      })
    })
    await page.goto(`${item.path}?source=recovery#test-fragment`)
    await page.clock.install()
    const button = page.locator(`#${item.button}`)
    const recovery = page.locator(`#${item.button}-recovery`)
    const address = recovery.getByRole('textbox', { name: 'Select and copy the address' })

    await expect(recovery).toBeHidden()
    await button.focus()
    await button.press('Enter')
    await expect(button).toHaveAccessibleName('Try again')
    await expect(button).toBeFocused()
    await expect(address).toHaveValue(`https://santi020k.com${item.path}`)
    await expect(address).toHaveAttribute('readonly')
    await page.clock.fastForward(2500)
    await expect(address).toBeVisible()
    await expect(button).toHaveText('Try again')
    await address.focus()
    expect(await address.evaluate(element => {
      if (!(element instanceof HTMLTextAreaElement)) throw new Error('Expected address field')

      return element.selectionStart === 0 && element.selectionEnd === element.value.length
    })).toBe(true)
    await page.emulateMedia({ media: 'print' })
    await expect(recovery).toBeHidden()
    await page.emulateMedia({ media: 'screen' })
    await button.click()
    await expect(button).toHaveText(item.success)
    await expect(recovery).toBeHidden()
    await expect(button).not.toHaveAttribute('aria-describedby')
    expect(await page.evaluate(() => sessionStorage.getItem('link-recovery-copy'))).toBe(`https://santi020k.com${item.path}`)
  })
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [320, 1440]) {
    test(`missing clipboard recovery fits ${width}px in ${theme} and survives resizing`, async ({ page }) => {
      const errors: string[] = []

      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(value => {
        localStorage.setItem('theme', value)
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      }, theme)
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(series)
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = `${size}%`
        await document.fonts.ready
      }, width === 320 ? 200 : 100)

      for (const buttonId of ['copy-link-btn']) {
        const button = page.locator(`#${buttonId}`)
        const recovery = page.locator(`#${buttonId}-recovery`)

        await button.click()
        await expect(recovery).toBeVisible()
        await recovery.getByRole('textbox').focus()
        await expect(recovery.getByRole('textbox')).toHaveCSS('outline-style', 'solid')
        const scan = await new AxeBuilder({ page }).include(`#${buttonId}`).include(`#${buttonId}-recovery`).analyze()

        expect(scan.violations).toEqual([])
        await expect.poll(() => recovery.evaluate(element => {
          const field = element.querySelector('textarea')

          return field !== null && field.scrollHeight <= field.clientHeight + 2 &&
            document.documentElement.scrollWidth <= innerWidth
        })).toBe(true)
      }
      for (const nextWidth of [390, 736, width]) await page.setViewportSize({ width: nextWidth, height: 1000 })
      await expect(page.locator('#copy-link-btn-recovery textarea')).toBeVisible()
      expect(errors).toEqual([])
    })
  }
}
