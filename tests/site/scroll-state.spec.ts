import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('scroll controls only mutate when crossing their visibility thresholds', async ({ page }) => {
  await page.goto('/blog/')
  const header = page.locator('[data-header-shell]')
  const backToTop = page.locator('#back-to-top')

  await expect(header).toHaveAttribute('data-scrolled', 'false')
  await expect(backToTop).toHaveAttribute('inert', '')
  await expect(backToTop).toHaveAttribute('data-ui-bound', 'true')

  const expectNoRepeatedWrites = async () => {
    const writes = await page.evaluate(async () => {
      const header = document.querySelector('[data-header-shell]')
      const button = document.getElementById('back-to-top')

      if (!header || !button) throw new Error('Scroll controls are missing')
      let count = 0
      const observer = new MutationObserver(records => {
        count += records.length
      })

      observer.observe(header, { attributes: true, attributeFilter: ['data-scrolled'] })
      observer.observe(button, { attributes: true, attributeFilter: ['inert', 'class'] })
      for (let index = 0; index < 12; index += 1) {
        window.dispatchEvent(new Event('scroll'))
        await new Promise<void>(resolve => requestAnimationFrame(() => {
          resolve()
        }))
      }
      observer.disconnect()
      return count
    })

    expect(writes).toBe(0)
  }

  await expectNoRepeatedWrites()
  await page.evaluate(() => {
    window.scrollTo({ top: 100, behavior: 'instant' })
  })
  await expect(header).toHaveAttribute('data-scrolled', 'true')
  await expect(backToTop).toHaveAttribute('inert', '')
  await expectNoRepeatedWrites()
  await page.evaluate(() => {
    window.scrollTo({ top: 600, behavior: 'instant' })
  })
  await expect(backToTop).not.toHaveAttribute('inert')
  await expect(backToTop).toHaveClass(/is-visible/u)
  await expectNoRepeatedWrites()
  await backToTop.focus()
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  await expect(page.locator('#main')).toBeFocused()
  await expect(header).toHaveAttribute('data-scrolled', 'false')
  await expect(backToTop).toHaveAttribute('inert', '')
  await expectNoRepeatedWrites()
})
