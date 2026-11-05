import { expect, test } from '@playwright/test'

test('project replacement guidance leads keyboard readers to the maintained package', async ({ page }) => {
  await page.goto('/portfolio/eslint-config-santi020k/')
  const notice = page.getByRole('complementary', { name: 'This library has been superseded.' })
  await expect(notice).toContainText('@santi020k/eslint-config-santi020k')
  await expect(notice).toContainText('The replacement is more composable, better documented, and actively maintained.')
  const replacement = notice.getByRole('link', { name: /Use for new projects.*Explore the replacement/u })
  await expect(replacement).toHaveAccessibleName(/@santi020k\/\s*eslint-config-basic/u)
  await expect(replacement).toHaveAttribute('href', '/portfolio/eslint-config-basic/')
  await replacement.focus()
  await expect(replacement).toBeFocused()
  await expect(replacement).toHaveCSS('outline-style', 'solid')
  await replacement.press('Enter')
  await expect(page).toHaveURL(/\/portfolio\/eslint-config-basic\/$/u)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('eslint-config-basic')
})

test.describe('Project replacement without client JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('preserves the recommendation and the original project article', async ({ page }) => {
    await page.goto('/portfolio/eslint-config-santi020k/')
    const notice = page.getByRole('complementary', { name: 'This library has been superseded.' })
    await expect(notice.getByRole('link')).toBeVisible()
    await expect(notice).toContainText('Use for new projects')
    await expect(page.getByRole('heading', { name: 'Building my original ESLint toolkit', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Why it was replaced', exact: true })).toBeVisible()
    await expect(page.getByRole('img', { name: 'NPM Package', exact: true })).toBeAttached()
  })
})
