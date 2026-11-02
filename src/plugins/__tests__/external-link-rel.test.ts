import type { Element } from 'hast'
import { describe, expect, test } from 'vitest'

import { externalLinkRel, isOwnedDestination } from '../external-link-rel'

const link = (href: unknown): Element => ({ children: [], properties: { href } as Element['properties'], tagName: 'a', type: 'element' })

describe('external link rel', () => {
  test.each([
    'https://santi020k.com/blog/',
    'https://lumen.santi020k.com/',
    'https://theme.santi020k.com/docs/',
    'https://github.com/santi020k',
    'https://github.com/santi020k/website/issues',
    'https://www.linkedin.com/in/santi020k/',
    'https://linkedin.com/in/santi020k',
    'https://medium.com/@santi020k/atomic-module-component-structure-for-react-34464b05832c',
    'https://www.npmjs.com/package/@santi020k/og',
    'https://www.npmjs.com/package/%40santi020k/lumen',
    'https://x.com/santi020k',
    'https://twitter.com/santi020k'
  ])('treats %s as an owned destination', href => {
    expect(isOwnedDestination(href)).toBe(true)
    expect(externalLinkRel(link(href))).toEqual(['noopener', 'noreferrer'])
  })

  test.each([
    'https://github.com/santi020kevil/website',
    'https://github.com/withastro/astro',
    'https://santi020k.com.example.com/',
    'https://notsanti020k.com/',
    'https://www.linkedin.com/company/santi020k',
    'https://medium.com/@someone-else/santi020k',
    'https://www.npmjs.com/package/santi020k-lookalike',
    'https://example.com/santi020k',
    'mailto:hi@santi020k.com',
    'not a url'
  ])('keeps nofollow for %s', href => {
    expect(isOwnedDestination(href)).toBe(false)
    expect(externalLinkRel(link(href))).toEqual(['nofollow', 'noopener', 'noreferrer'])
  })

  test('keeps nofollow when a link has no usable href', () => {
    expect(externalLinkRel(link(undefined))).toEqual(['nofollow', 'noopener', 'noreferrer'])
    expect(externalLinkRel(link(['https://lumen.santi020k.com/']))).toEqual(['nofollow', 'noopener', 'noreferrer'])
  })

  test('tolerates malformed percent-encoding', () => {
    expect(isOwnedDestination('https://github.com/%E0%A4%A')).toBe(false)
  })
})
