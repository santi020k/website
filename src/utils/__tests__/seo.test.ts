import { describe, expect, test } from 'vitest'

import { createSeoDescription, createSeoTitle, serializeStructuredData } from '../seo'

describe('serializeStructuredData', () => {
  test('keeps content from escaping an inline script while preserving JSON values', () => {
    const value = { '@type': 'Article', headline: '</script><script>alert("content")</script>' }
    const serialized = serializeStructuredData(value)

    expect(serialized).not.toContain('<')
    expect(JSON.parse(serialized)).toEqual(value)
  })

  test('preserves arrays of schema nodes without changing their structure', () => {
    const value = [{ '@type': 'Article', headline: 'A < B & C' }, { '@type': 'BreadcrumbList' }]

    expect(JSON.parse(serializeStructuredData(value))).toEqual(value)
  })
})

describe('createSeoTitle', () => {
  test('keeps the site title unchanged on the homepage', () => {
    expect(
      createSeoTitle('Santiago Molina | santi020k', 'Santiago Molina | santi020k')
    ).toBe('Santiago Molina | santi020k')
  })

  test('removes a duplicated author suffix before branding', () => {
    expect(
      createSeoTitle(
        'Software Engineering Blog — Santiago Molina', 'Santiago Molina | santi020k'
      )
    ).toBe('Software Engineering Blog | santi020k')
  })

  test('limits long titles to 60 characters without splitting a word', () => {
    const title = createSeoTitle(
      'Authentication and Authorization in Next.js Applications with Supabase', 'Santiago Molina | santi020k'
    )

    expect(title.length).toBeLessThanOrEqual(60)
    expect(title).toMatch(/… \| santi020k$/)
  })
})

describe('createSeoDescription', () => {
  test('expands a short description with page-specific context', () => {
    const description = createSeoDescription(
      'The page you are looking for could not be found.', 'Page not found'
    )

    expect(description.length).toBeGreaterThanOrEqual(120)
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toContain('Page not found')
  })

  test('limits long descriptions without exceeding 160 characters', () => {
    const description = createSeoDescription('word '.repeat(50), 'Long page')

    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toMatch(/…$/)
  })
})
