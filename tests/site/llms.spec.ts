import { expect, test } from '@playwright/test'

test('llms.txt indexes the published site with working local links', async ({ request }) => {
  const response = await request.get('/llms.txt')

  expect(response.ok()).toBe(true)

  const body = await response.text()
  const [title, , summary] = body.split('\n')

  expect(title).toBe('# Santiago Molina')
  expect(summary).toMatch(/^> \S/u)

  for (const section of ['Pages', 'Case studies', 'Projects', 'Series', 'Articles', 'Optional']) {
    expect(body).toContain(`\n## ${section}\n`)
  }

  const links = [...body.matchAll(/^- \[(?<title>(?:\\.|[^\]])+)\]\((?<url>[^)\s]+)\)(?::\s(?<description>.+))?$/gmu)]
    .map(match => ({ description: match.groups?.description, title: match.groups?.title, url: new URL(match.groups?.url ?? '') }))

  expect(links.length).toBeGreaterThan(40)
  expect(new Set(links.map(link => link.url.href)).size).toBe(links.length)
  expect(links.every(link => link.url.origin === 'https://santi020k.com')).toBe(true)
  expect(links.filter(link => link.url.pathname.startsWith('/blog/') && !link.description)).toEqual([])

  for (const link of links) {
    const page = await request.get(link.url.pathname)

    expect(page.status(), link.url.pathname).toBe(200)
  }
})
