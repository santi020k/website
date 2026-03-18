import { expect, test } from '@playwright/test'

test('homepage has correct title and main sections', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  // Replacing 'santi020k' with the actual title if known,
  // but many personal sites have the name in the title.
  await expect(page).toHaveTitle(/santi|Santi/)

  // Check for navigation links
  const nav = page.locator('nav')
  await expect(nav).toBeVisible()

  // Check for some main menu items (based on site.config.ts)
  const homeLink = page.getByRole('link', { name: /home/i })
  await expect(homeLink).toBeVisible()
})

test('navigation to blog works', async ({ page }) => {
  await page.goto('/')

  // Find the blog/posts link
  const postsLink = page.getByRole('link', { name: /posts|blog/i }).first()
  if (await postsLink.isVisible()) {
    await postsLink.click()
    await expect(page).toHaveURL(/\/post/)
  }
})
