import { describe, expect, test } from 'vitest'

import { createSecurityTxt } from '../security-txt'

describe('security.txt', () => {
  test('lists a contact, a canonical URL, and an expiry about six months after the build', () => {
    const text = createSecurityTxt({ email: 'hi@santi020k.com', now: new Date('2026-11-13T19:45:12.345Z'), site: 'https://santi020k.com' })

    expect(text).toBe([
      'Contact: mailto:hi@santi020k.com',
      'Expires: 2027-05-12T00:00:00Z',
      'Preferred-Languages: en, es',
      'Canonical: https://santi020k.com/.well-known/security.txt',
      ''
    ].join('\n'))
  })

  test('always expires in the future and less than a year away, as RFC 9116 recommends', () => {
    const now = new Date()
    const expires = new Date(/^Expires: (.+)$/mu.exec(createSecurityTxt({ email: 'a@b.c', now, site: 'https://example.com' }))?.[1] ?? '')

    expect(expires.getTime()).toBeGreaterThan(now.getTime())
    expect(expires.getTime() - now.getTime()).toBeLessThan(365 * 24 * 60 * 60 * 1000)
  })
})
