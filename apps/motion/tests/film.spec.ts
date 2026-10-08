import { createHash } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from '../../../tests/helpers/accessibility'
import { chapters, duration, formats } from '../src/composition'

for (const format of formats) {
  test(`${format} has loaded assets, readable chapters and deterministic seeking`, async ({ page }) => {
    const errors: string[] = []
    const external: string[] = []

    page.on('pageerror', error => errors.push(error.message))

    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:')) external.push(request.url())
    })

    await page.setViewportSize({ width: format === 'landscape' ? 1920 : 1080, height: format === 'portrait' ? 1920 : 1080 })

    await page.goto(`/${format}/`)

    await page.evaluate(async () => {
      await document.fonts.ready

      await Promise.all([...document.images].map(image => image.decode()))
    })

    await expect.poll(() => page.evaluate(() => window.__timelines?.['website-history']?.duration())).toBe(duration)

    for (const chapter of chapters) {
      await page.evaluate(time => {
        window.__timelines?.['website-history']?.pause().seek(time)
      }, chapter.still)

      const scene = page.locator(`[data-era="${chapter.id}"]`)

      await expect(scene).toBeVisible()

      await expect(scene.locator('h2')).toHaveText(chapter.title)

      expect(await scene.evaluate(element => {
        const text = element.querySelector('.chapter-copy')?.getBoundingClientRect()
        const art = element.querySelector('.film-artwork')?.getBoundingClientRect()
        const root = element.getBoundingClientRect()

        return Boolean(text && art && text.left >= 0 &&
          text.right <= root.right && text.bottom <= root.bottom &&
          (text.right <= art.left || text.bottom <= art.top))
      })).toBe(true)

      expect(await scene.evaluate(element => {
        const image = element.querySelector('.desktop-capture')?.getBoundingClientRect()
        const footer = element.querySelector('.film-footer')?.getBoundingClientRect()

        return Boolean(image && footer && image.bottom + 12 <= footer.top)
      })).toBe(true)

      await page.screenshot({ path: `renders/stills/${format}-${chapter.id}.png` })
    }

    await page.evaluate(() => {
      window.__timelines?.['website-history']?.pause().seek(8.5)
    })

    const first = createHash('sha256').update(await page.screenshot({ path: `renders/stills/${format}-seek-first.png` })).digest('hex')

    await page.evaluate(() => {
      window.__timelines?.['website-history']?.pause().seek(24)
    })

    await expect(page.locator('.ending')).toBeVisible()

    await page.evaluate(() => {
      window.__timelines?.['website-history']?.pause().seek(8.5)
    })

    expect(createHash('sha256').update(await page.screenshot({ path: `renders/stills/${format}-seek-last.png` })).digest('hex')).toBe(first)

    expect(errors).toEqual([])

    expect(external).toEqual([])
  })
}

test('preview supports chapters, formats, keyboard and reduced motion', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Play animation' })).toBeDisabled()

  await expect(page.locator('#motion-preference')).toBeVisible()

  await page.getByRole('button', { name: 'V3', exact: true }).focus()

  await page.keyboard.press('Enter')

  await expect(page.locator('#playback-status')).toHaveText('Paused · V3')

  await page.getByRole('button', { name: 'Landscape', exact: true }).click()

  await expect(page.locator('#composition')).toHaveAttribute('src', '/landscape/')

  await expect(page.frameLocator('#composition').locator('[data-era="v3"]')).toBeVisible()

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    await expectNoUnexpectedAccessibilityViolations(page)
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await expect(page.getByRole('button', { name: 'Play animation' })).toBeEnabled()

  await page.getByRole('button', { name: 'Play animation' }).click()

  await expect(page.locator('#playback-status')).toContainText('Playing')

  await page.getByRole('button', { name: 'Pause', exact: true }).click()

  await expect(page.locator('#playback-status')).toContainText('Paused')
})

test('preview rejects foreign senders and non-finite seek values', async ({ page }) => {
  await page.goto('/')

  const frame = page.frameLocator('#composition')

  await expect(frame.locator('.opening')).toBeVisible()

  await frame.locator('body').evaluate(() => {
    for (const command of [null, {}, { type: 'website-motion-seek', time: Number.NaN }, { type: 'website-motion-seek', time: Number.POSITIVE_INFINITY }]) {
      window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: window.parent, data: command }))
    }

    window.dispatchEvent(new MessageEvent('message', { origin: 'https://example.com', source: window.parent, data: { type: 'website-motion-seek', time: 18.5 } }))

    window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, source: window, data: { type: 'website-motion-play' } }))
  })

  expect(await frame.locator('body').evaluate(() => window.__timelines?.['website-history']?.time())).toBe(1)

  expect(await frame.locator('body').evaluate(() => window.__timelines?.['website-history']?.paused())).toBe(true)
})
