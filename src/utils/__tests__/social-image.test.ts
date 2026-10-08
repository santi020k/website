import type { OgRouteManifest } from '@santi020k/og'
import { describe, expect, test } from 'vitest'

import { routeManifestSchema } from '../../data/og-manifest'
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

const manifest: OgRouteManifest = {
  generatorVersion: '1.2.0',
  routes: {
    '/portfolio/example/': {
      images: [
        { format: 'webp', height: 630, output: 'portfolio/example-logo.webp', primary: true, url: '/og/portfolio/example-logo.webp?v=abc123', width: 1200 },
        { format: 'webp', height: 630, output: 'portfolio/example.webp', primary: false, url: '/og/portfolio/example.webp?v=abc123', width: 1200 }
      ],
      pathname: '/portfolio/example/'
    }
  },
  version: 1
}

describe('generated social image metadata', () => {
  const base = 'https://santi020k.com/'
  const route = '/portfolio/example/'
  const expected = 'https://santi020k.com/og/portfolio/example-logo.webp?v=abc123'

  test('uses the generated fingerprint with normalized route paths', () => {
    expect(getSocialImageURL('/portfolio/example?preview=1', base, undefined, manifest)).toBe(expected)
  })

  test('versions generated overrides and legacy aliases', () => {
    for (const override of ['/og/portfolio/example-logo.webp', '/og/portfolio/example.webp']) {
      expect(getSocialImageURL(route, base, override, manifest)).toBe(expected)
    }
  })

  test('preserves explicit custom artwork and external overrides', () => {
    expect(getSocialImageURL(route, base, '/custom.webp', manifest)).toBe('https://santi020k.com/custom.webp')
    expect(getSocialImageURL(route, base, 'https://other.test/og/portfolio/example.webp', manifest))
      .toBe('https://other.test/og/portfolio/example.webp')
  })

  test('retains fallback images for routes absent from the manifest', () => {
    expect(getSocialImageURL('/offline/', base, undefined, manifest)).toBe('https://santi020k.com/og/pages/offline.webp')
  })

  test('preserves overrides when a route has no public manifest URL', () => {
    const withoutURL: OgRouteManifest = {
      ...manifest,
      routes: { [route]: { pathname: route, images: [] } }
    }
    expect(getSocialImageURL(route, base, '/custom.webp', withoutURL)).toBe('https://santi020k.com/custom.webp')
  })
})

describe('generated manifest validation', () => {
  test('accepts the published manifest contract', () => {
    expect(routeManifestSchema.parse(manifest).routes['/portfolio/example/']?.pathname).toBe('/portfolio/example/')
  })

  test('rejects unsupported manifest versions and missing public image URLs', () => {
    expect(() => routeManifestSchema.parse({ ...manifest, version: 2 })).toThrow()
    expect(() => routeManifestSchema.parse({
      ...manifest,
      routes: {
        '/': {
          images: [{ format: 'webp', height: 630, output: 'index.webp', primary: true, width: 1200 }],
          pathname: '/'
        }
      }
    })).toThrow()
  })
})
