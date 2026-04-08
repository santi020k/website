import { describe, expect, it } from 'vitest'

import { getSocialImagePath, getSocialImageSlug, getSocialImageURL } from '../social-image'

describe('getSocialImageSlug', () => {
  it('strips leading and trailing slashes', () => {
    expect(getSocialImageSlug('/about/')).toBe('about')
  })

  it('joins path segments with double dashes', () => {
    expect(getSocialImageSlug('/blog/my-post/')).toBe('blog--my-post')
  })

  it('returns empty string for root pathname', () => {
    expect(getSocialImageSlug('/')).toBe('')
  })

  it('handles pathnames without trailing slash', () => {
    expect(getSocialImageSlug('/speaking')).toBe('speaking')
  })

  it('encodes special characters and replaces % with ~', () => {
    // "C++" encodes to "C%2B%2B" which becomes "C~2B~2B"
    expect(getSocialImageSlug('/technologies/C++/')).toBe('technologies--C~2B~2B')
  })

  it('handles already-encoded segments safely (no double-encoding)', () => {
    // encodes the decoded value back consistently
    const slug = getSocialImageSlug('/technologies/React.js/')
    expect(slug).toBe('technologies--React.js')
  })

  it('produces stable slugs for multi-level paths', () => {
    expect(getSocialImageSlug('/portfolio/void/')).toBe('portfolio--void')
  })
})

describe('getSocialImagePath', () => {
  it('returns /default.webp for root pathname', () => {
    expect(getSocialImagePath('/')).toBe('/default.webp')
  })

  it('returns an OG page path for a static page', () => {
    expect(getSocialImagePath('/about/')).toBe('/og/pages/about.png')
  })

  it('builds correct path for a nested pathname', () => {
    expect(getSocialImagePath('/blog/my-post/')).toBe('/og/pages/blog--my-post.png')
  })

  it('handles technology paths with special characters', () => {
    const path = getSocialImagePath('/technologies/C++/')
    expect(path).toBe('/og/pages/technologies--C~2B~2B.png')
  })
})

describe('getSocialImageURL', () => {
  const baseURL = 'https://santi020k.me/'

  it('resolves a full URL from a base URL string', () => {
    expect(getSocialImageURL('/about/', baseURL)).toBe('https://santi020k.me/og/pages/about.png')
  })

  it('resolves a full URL when baseURL is a URL object', () => {
    const base = new URL('https://santi020k.me/')
    expect(getSocialImageURL('/about/', base)).toBe('https://santi020k.me/og/pages/about.png')
  })

  it('uses overridePath instead of computing from pathname', () => {
    const result = getSocialImageURL('/blog/my-post/', baseURL, '/custom-image.webp')
    expect(result).toBe('https://santi020k.me/custom-image.webp')
  })

  it('falls back to the default site URL when baseURL is undefined', () => {
    const result = getSocialImageURL('/about/', undefined)
    expect(result).toBe('https://santi020k.me/og/pages/about.png')
  })

  it('returns the default webp for root when no override is given', () => {
    expect(getSocialImageURL('/', baseURL)).toBe('https://santi020k.me/default.webp')
  })
})
