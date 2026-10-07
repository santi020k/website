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

  test('preserves long authored titles without cutting off the subject', () => {
    const title = 'Authentication and Authorization in Next.js Applications with Supabase'

    expect(createSeoTitle(title, 'Santiago Molina | santi020k')).toBe(`${title} | santi020k`)
  })

  test.each([
    '  Shipping   macOS Tools \n with a Homebrew Tap  ',
    'Shipping macOS Tools with a Homebrew Tap | santi020k',
    'Shipping macOS Tools with a Homebrew Tap - Santiago Molina'
  ])('normalizes whitespace and applies the brand once: %s', title => {
    expect(createSeoTitle(title, 'Santiago Molina | santi020k'))
      .toBe('Shipping macOS Tools with a Homebrew Tap | santi020k')
  })
})

describe('createSeoDescription', () => {
  test('keeps short descriptions without invented context', () => {
    const description = 'The page you are looking for could not be found.'

    expect(createSeoDescription(description)).toBe(description)
  })

  test('preserves complete descriptions longer than a typical search snippet', () => {
    const description = 'Built and scaled the official X Games digital platform — a high-traffic sports media site serving millions of fans — with real-time live streaming, geo-based access control, and a programmatic ad infrastructure powered by Google Ad Manager.'

    expect(createSeoDescription(description)).toBe(description)
  })

  test('normalizes whitespace without changing the wording', () => {
    expect(createSeoDescription('  A guide to\n  repository checks.  '))
      .toBe('A guide to repository checks.')
  })

  test('does not invent content for an empty description', () => {
    expect(createSeoDescription('   ')).toBe('')
  })
})
