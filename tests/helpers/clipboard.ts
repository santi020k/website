import { expect, type Page } from '@playwright/test'

// Chromium supports clipboard read permission. Other engines still verify the
// copy-success event and accessible feedback in the calling test.
export const expectArticleClipboard = async (
  page: Page,
  browserName: 'chromium' | 'firefox' | 'webkit',
  articlePath: string
) => {
  if (browserName !== 'chromium') return

  await expect.poll(() => page.evaluate(async () => navigator.clipboard.readText()))
    .toContain(articlePath)
}
