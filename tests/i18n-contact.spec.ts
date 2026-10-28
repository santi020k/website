import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'

const getRequiredHref = async (link: Locator): Promise<string> => {
  const href = await link.getAttribute('href')

  if (!href) throw new Error('The contact retry link must contain the composed message URL')

  return href
}

test('Spanish contact intake composes and retries a localized draft without sending it', async ({ page }) => {
  await page.goto('/es/work-with-me/')
  await page.evaluate(() => {
    window.open = url => {
      document.documentElement.dataset.intakeOpenedHref = String(url)

      return null
    }
  })

  await expect(page.locator('.editorial-page-meta')).toContainText('Charlas técnicas')
  await expect(page.locator('.editorial-page-meta')).toContainText('Equipos, IA y calidad del código')

  const form = page.locator('[data-whatsapp-intake]')

  await expect(form).toBeVisible()
  await form.locator('[data-intake-name]').fill('Ana')
  await form.locator('[data-intake-company]').fill('Equipo Ejemplo')
  await form.locator('[data-intake-context]').fill('Un taller para nuestro equipo.')
  await form.locator('[data-intake-submit]').click()
  await expect(form.locator('[data-intake-status]')).toHaveText(
    'Tu mensaje está listo. Revísalo en WhatsApp y pulsa enviar.'
  )

  const retry = form.locator('[data-intake-retry]')
  const firstHref = await getRequiredHref(retry)

  const firstMessage = new URL(firstHref).searchParams.get('text')

  expect(firstMessage).toBe(
    'Hola Santiago, soy Ana de Equipo Ejemplo. Me gustaría invitarte a dar una charla o taller. Un taller para nuestro equipo.'
  )
  await expect(page.locator('html')).toHaveAttribute('data-intake-opened-href', firstHref)
  await expect(form.locator('[data-intake-name]')).toHaveValue('Ana')
  await form.locator('[data-intake-topic]').filter({ hasText: 'Usar IA en ingeniería' }).click()
  await form.locator('[data-intake-context]').fill('Necesitamos mejores controles.')

  const nextHref = await retry.getAttribute('href')
  const nextMessage = new URL(nextHref ?? '').searchParams.get('text')

  expect(nextMessage).toContain('Me gustaría recibir ayuda para usar IA en nuestro trabajo de ingeniería.')
  expect(nextMessage).toContain('Necesitamos mejores controles.')
  expect(nextMessage).not.toContain('Un taller para nuestro equipo.')
})

test('Spanish contact fallbacks preserve their locale and make no delivery claim', async ({ page }) => {
  await page.goto('/es/work-with-me/sent/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Tienes algo en mente?')
  await expect(page.getByRole('link', { name: 'Escribir un mensaje' })).toHaveAttribute('href', '/es/work-with-me/#start')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u)

  const href = await page.locator('[data-sent-whatsapp]').getAttribute('href')

  expect(new URL(href ?? '').searchParams.get('text')).toBe('Hola Santiago, vi tu sitio web y me gustaría hablar sobre')
})

test('Spanish contact keeps a usable direct link without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })

  try {
    const page = await context.newPage()

    await page.goto('/es/work-with-me/')
    await expect(page.locator('[data-whatsapp-intake]')).toBeHidden()
    await expect(page.locator('[data-intake-fallback]')).toBeVisible()

    const link = page.locator('[data-intake-fallback] a')

    await expect(link).toHaveText('Abrir WhatsApp directamente')

    const href = await link.getAttribute('href')

    expect(new URL(href ?? '').searchParams.get('text')).toBe('Hola Santiago, vi tu sitio web y me gustaría hablar sobre')
  } finally {
    await context.close()
  }
})
