import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from '@playwright/test'
import sharp from 'sharp'

import versions from '../../packages/website-history/versions.json' with { type: 'json' }

const baseUrl = process.env.HISTORY_PREVIEW_URL ?? 'http://127.0.0.1:4321'
const output = resolve(import.meta.dirname, '../../src/assets/website-history')
const browser = await chromium.launch()

try {
  await mkdir(output, { recursive: true })

  for (const id of [...versions.map(version => version.id), 'v4']) {
    for (const [device, viewport] of [
      ['desktop', { width: 1440, height: 1000 }],
      ['mobile', { width: 390, height: 844 }]
    ]) {
      const page = await browser.newPage({ viewport, colorScheme: 'light', reducedMotion: 'reduce' })

      await page.goto(`${baseUrl}${id === 'v4' ? '/' : `/${id}/`}`, { waitUntil: 'networkidle' })

      await page.evaluate(async () => {
        await document.fonts.ready

        await Promise.all([...document.images].map(async image => {
          image.loading = 'eager'

          await image.decode().catch(() => undefined)
        }))
      })

      const failedImages = await page.locator('img').evaluateAll(images => images.filter(image => image instanceof HTMLImageElement && (!image.complete || image.naturalWidth === 0)).map(image => image instanceof HTMLImageElement ? image.src : ''))

      if (failedImages.length > 0) throw new Error(`${id}: images did not load: ${failedImages.join(', ')}`)

      // The exhibit captures the design; the archive notice remains visible in the usable app.
      await page.addStyleTag({ content: '.website-archive-banner{visibility:hidden!important}' })

      await sharp(await page.screenshot({ animations: 'disabled' })).webp({ quality: 86 }).toFile(resolve(output, `${id}-${device}.webp`))

      await page.close()

      console.log(`Captured ${id} ${device}.`)
    }
  }
} finally {
  await browser.close()
}
