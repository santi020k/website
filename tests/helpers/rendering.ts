import { expect, type Locator, type Page } from '@playwright/test'

// With JavaScript disabled, Firefox never settles a promise returned to `page.evaluate`, while
// synchronous reads still work in every browser. Pages without scripts are therefore polled
// from the test instead of awaiting `document.fonts.ready` or `image.decode()` in the page.

/** Wait until no web font is loading, with or without page JavaScript. */
export const waitForFonts = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe('loaded')
}

/** Wait until every image the locator matches has loaded, with or without page JavaScript. */
export const waitForImages = async (images: Locator) => {
  await expect.poll(() => images.evaluateAll(elements => elements.every(
    element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0
  ))).toBe(true)
}
