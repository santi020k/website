import { describe, expect, test } from 'vitest'

import { getSocialImagePath, getSocialImageSlug, getSocialImageURL } from '../social-image'

describe('getSocialImageSlug', () => {
  test('strips leading and trailing slashes', () => {
    expect(getSocialImageSlug('/about/')).toBe('about')
  })

  test('joins path segments with double dashes', () => {
    expect(getSocialImageSlug('/blog/my-post/')).toBe('blog--my-post')
  })

  test('returns empty string for root pathname', () => {
    expect(getSocialImageSlug('/')).toBe('')
  })

  test('handles pathnames without trailing slash', () => {
    expect(getSocialImageSlug('/speaking')).toBe('speaking')
  })

  test('encodes special characters and replaces % with ~', () => {
    // "C++" encodes to "C%2B%2B" which becomes "C~2B~2B"
    expect(getSocialImageSlug('/technologies/C++/')).toBe('technologies--C~2B~2B')
  })

  test('handles already-encoded segments safely (no double-encoding)', () => {
    // encodes the decoded value back consistently
    const slug = getSocialImageSlug('/technologies/React.js/')
    expect(slug).toBe('technologies--React.js')
  })

  test('produces stable slugs for multi-level paths', () => {
    expect(getSocialImageSlug('/portfolio/void/')).toBe('portfolio--void')
  })
})

describe('getSocialImagePath', () => {
  test('returns the generated homepage OG path for root pathname', () => {
    expect(getSocialImagePath('/')).toBe('/og/pages/index.webp')
  })

  test('returns an OG page path for a static page', () => {
    expect(getSocialImagePath('/about/')).toBe('/og/pages/about.webp')
  })

  test('builds correct path for a nested pathname', () => {
    expect(getSocialImagePath('/blog/my-post/')).toBe('/og/pages/blog--my-post.webp')
  })

  test('handles technology paths with special characters', () => {
    const path = getSocialImagePath('/technologies/C++/')
    expect(path).toBe('/og/pages/technologies--C~2B~2B.webp')
  })
})

describe('getSocialImageURL', () => {
  const baseURL = 'https://santi020k.com/'

  test('resolves a full URL from a base URL string', () => {
    expect(getSocialImageURL('/about/', baseURL)).toBe('https://santi020k.com/og/pages/about.webp')
  })

  test('resolves a full URL when baseURL is a URL object', () => {
    const base = new URL('https://santi020k.com/')
    expect(getSocialImageURL('/about/', base)).toBe('https://santi020k.com/og/pages/about.webp')
  })

  test('uses overridePath instead of computing from pathname', () => {
    const result = getSocialImageURL('/blog/my-post/', baseURL, '/custom-image.webp')
    expect(result).toBe('https://santi020k.com/custom-image.webp')
  })

  test('falls back to the default site URL when baseURL is undefined', () => {
    const result = getSocialImageURL('/about/', undefined)
    expect(result).toBe('https://santi020k.com/og/pages/about.webp')
  })

  test('returns the generated homepage OG URL for root when no override is given', () => {
    expect(getSocialImageURL('/', baseURL)).toBe('https://santi020k.com/og/pages/index.webp')
  })
})
