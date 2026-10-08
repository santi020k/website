import { expect, test } from '@playwright/test'

import { expectNoUnexpectedAccessibilityViolations } from '../../../tests/helpers/accessibility'
import { chapters, duration, endingStill, formats, openingStill } from '../src/composition'

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

    const state = () => page.locator('[data-era="v1"]').evaluate(element => (
      [element, ...element.querySelectorAll('*')].map(item => {
        const style = getComputedStyle(item)

        return [style.transform, style.opacity, style.visibility, style.clipPath]
      })
    ))

    const firstState = await state()
    const first = await page.screenshot({ path: `renders/stills/${format}-seek-first.png` })

    for (const [name, time] of [['opening', openingStill], ['ending', endingStill]] as const) {
      await page.evaluate(time => {
        window.__timelines?.['website-history']?.pause().seek(time)
      }, time)

      const scene = page.locator(`.${name}`)

      await expect(scene).toBeVisible()

      expect(await scene.evaluate(element => {
        const root = element.getBoundingClientRect()
        const center = element.querySelector('.brand-center')?.getBoundingClientRect()
        const bottom = element.querySelector('.brand-bottom')?.getBoundingClientRect()

        return [...element.querySelectorAll('.brand-center, .brand-kicker, .brand-bottom')].every(item => {
          const box = item.getBoundingClientRect()

          return box.left >= 0 && box.right <= root.right && box.top >= 0 && box.bottom <= root.bottom
        }) && Boolean(center && bottom && center.bottom < bottom.top)
      })).toBe(true)

      await page.screenshot({ path: `renders/stills/${format}-${name}.png` })
    }

    await expect(page.locator('.ending')).toBeVisible()

    await page.evaluate(() => {
      window.__timelines?.['website-history']?.pause().seek(8.5)
    })

    expect(await state()).toEqual(firstState)

    const last = await page.screenshot({ path: `renders/stills/${format}-seek-last.png` })

    const largestDifference = await page.evaluate(async ({ first, last }) => {
      const decode = async (source: string) => {
        const image = new Image()

        image.src = `data:image/png;base64,${source}`

        await image.decode()

        const canvas = document.createElement('canvas')

        canvas.width = image.naturalWidth

        canvas.height = image.naturalHeight

        const context = canvas.getContext('2d')

        if (!context) throw new Error('Screenshot comparison needs a 2D canvas')

        context.drawImage(image, 0, 0)

        return context.getImageData(0, 0, canvas.width, canvas.height).data
      }

      const [before, after] = await Promise.all([decode(first), decode(last)])

      if (before.length !== after.length) throw new Error('Screenshot dimensions changed')

      return before.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - (after[index] ?? -255))), 0)
    }, { first: first.toString('base64'), last: last.toString('base64') })

    // Hardware antialiasing varies by up to two 8-bit channel levels after repaint.
    // Require identical animation properties and less than 1% channel variation.
    expect(largestDifference).toBeLessThanOrEqual(2)

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

  expect(await frame.locator('body').evaluate(() => window.__timelines?.['website-history']?.time())).toBe(openingStill)

  expect(await frame.locator('body').evaluate(() => window.__timelines?.['website-history']?.paused())).toBe(true)
})

test('music starts on request, stays synchronized, and stops on seek or reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await page.goto('/')

  const audio = page.frameLocator('#composition').locator('audio')

  await expect.poll(() => audio.evaluate(element => (
    element instanceof HTMLAudioElement && element.readyState >= 2
  ))).toBe(true)

  expect(await audio.evaluate(element => element instanceof HTMLAudioElement && element.paused)).toBe(true)

  await page.getByRole('button', { name: 'Music off' }).click()

  await page.getByRole('button', { name: 'Play animation' }).click()

  await expect.poll(() => audio.evaluate(element => (
    element instanceof HTMLAudioElement && !element.paused && element.currentTime > 0
  ))).toBe(true)

  expect(await audio.evaluate(element => (
    element instanceof HTMLAudioElement &&
    Math.abs(element.currentTime - (window.__timelines?.['website-history']?.time() ?? 0)) < 0.3
  ))).toBe(true)

  await page.getByRole('button', { name: 'V4', exact: true }).click()

  await expect.poll(() => audio.evaluate(element => element instanceof HTMLAudioElement && element.paused)).toBe(true)

  await page.getByRole('button', { name: 'Square', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Music on' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Play animation' }).click()

  await expect.poll(() => audio.evaluate(element => element instanceof HTMLAudioElement && !element.paused)).toBe(true)

  await page.emulateMedia({ reducedMotion: 'reduce' })

  await expect.poll(() => audio.evaluate(element => element instanceof HTMLAudioElement && element.paused)).toBe(true)
})

test('blocked audio offers recovery while the film remains usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  await page.goto('/')

  await page.frameLocator('#composition').locator('audio').evaluate(element => {
    if (element instanceof HTMLAudioElement) element.play = () => Promise.reject(new DOMException('Playback blocked', 'NotAllowedError'))
  })

  await page.getByRole('button', { name: 'Music off' }).click()

  await page.getByRole('button', { name: 'Play animation' }).click()

  await expect(page.locator('#audio-status')).toBeVisible()

  await expect(page.locator('#playback-status')).toContainText('Playing')

  await page.getByRole('button', { name: 'Music on' }).click()

  await expect(page.locator('#audio-status')).toBeHidden()
})
