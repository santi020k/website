import { expect, test } from '@playwright/test'

test('homepage has correct title and main sections', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/santi|Santi/)

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })

  await expect(mainMenu).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Portfolio' })).toBeVisible()
  await expect(mainMenu.getByRole('link', { name: 'Blog' })).toBeVisible()
})

test('navigation to portfolio works', async ({ page }) => {
  await page.goto('/')

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })
  const portfolioLink = mainMenu.getByRole('link', { name: 'Portfolio' })

  await portfolioLink.click()

  await expect(page).toHaveURL(/\/portfolio\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Case studies/i })).toBeVisible()
})

test('navigation to blog works', async ({ page }) => {
  await page.goto('/')

  const mainMenu = page.getByRole('navigation', { name: 'Main menu' })
  const blogLink = mainMenu.getByRole('link', { name: 'Blog' })

  await blogLink.click()

  await expect(page).toHaveURL(/\/posts\/$/)
  await expect(page.getByRole('heading', { level: 1, name: /Writing about frontend craft/i })).toBeVisible()
})
