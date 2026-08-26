import { describe, expect, test } from 'vitest'

import {
  createAuthorSchema,
  createPublisherSchema,
  createSchemaEntityId,
  createWebsiteSchemaReference
} from '@/site.config'

describe('schema entity references', () => {
  const siteUrl = new URL('https://santi020k.com/')

  test('uses stable identifiers for the site-wide entity graph', () => {
    expect(createSchemaEntityId('person', siteUrl)).toBe('https://santi020k.com/#person')
    expect(createSchemaEntityId('organization', siteUrl)).toBe('https://santi020k.com/#organization')
    expect(createSchemaEntityId('website', siteUrl)).toBe('https://santi020k.com/#website')
  })

  test('links page schemas back to the canonical entities', () => {
    expect(createAuthorSchema(siteUrl)).toMatchObject({
      '@id': 'https://santi020k.com/#person',
      '@type': 'Person',
      url: 'https://santi020k.com/about/'
    })
    expect(createPublisherSchema(siteUrl)).toEqual({
      '@id': 'https://santi020k.com/#organization',
      '@type': 'Organization'
    })
    expect(createWebsiteSchemaReference(siteUrl)).toEqual({
      '@id': 'https://santi020k.com/#website',
      '@type': 'WebSite'
    })
  })
})
