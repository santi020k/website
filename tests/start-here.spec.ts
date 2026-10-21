import { expect, test } from '@playwright/test'

test('curated reading complements recent writing and opens a real article', async ({ page }) => {
  await page.goto('/')
  const curated = page.getByRole('region', { name: 'Start here', exact: true })
  const links = curated.getByRole('link')
  await expect(links).toHaveCount(3)
  await expect(links).toContainText(['How I build', 'How I think', 'Why I make things'])
  await expect(page.getByRole('list', { name: 'Latest writing' }).getByRole('link')).toHaveCount(4)
  await expect(page.getByRole('link', { name: 'Follow via RSS' })).toHaveAttribute('href', '/feed.xml')
  await links.last().focus()
  await expect(links.last()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/blog\/why-i-built-between-contractions\/$/u)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Why I Built Between Contractions')
})
