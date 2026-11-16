import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

for (const label of ['Download 2-page resume PDF', 'Download full CV PDF']) {
  test(`only fetches ${label} after activation`, async ({ page }) => {
    const requests: string[] = []

    await page.clock.install()
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/pdf/')) requests.push(request.url())
    })
    await page.goto('/resume/')
    const download = page.getByRole('link', { name: label, exact: true })

    await download.hover()
    await page.clock.runFor(300)
    await download.focus()
    await page.clock.runFor(300)
    expect(requests).toEqual([])
    const downloaded = page.waitForEvent('download')

    await download.click()
    const file = await downloaded

    expect(file.suggestedFilename()).toMatch(/\.pdf$/u)
    expect(await file.failure()).toBeNull()
    const bytes = await readFile(await file.path())

    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  })
}
