import { describe, expect, test } from 'vitest'

import { formatLlmsLink, formatLlmsSection } from '../llms'

describe('llms.txt formatting', () => {
  test('formats a link with a one-line description', () => {
    expect(formatLlmsLink('About', 'https://santi020k.com/about/', 'Background,\n  working principles.'))
      .toBe('- [About](https://santi020k.com/about/): Background, working principles.')
  })

  test('omits the separator when there is no description', () => {
    expect(formatLlmsLink('Sitemap', 'https://santi020k.com/sitemap.xml')).toBe('- [Sitemap](https://santi020k.com/sitemap.xml)')
    expect(formatLlmsLink('Sitemap', 'https://santi020k.com/sitemap.xml', '   ')).toBe('- [Sitemap](https://santi020k.com/sitemap.xml)')
  })

  test('escapes characters that would break Markdown links', () => {
    expect(formatLlmsLink('Arrays [and] slices \\ tips', 'https://santi020k.com/blog/a (b)/'))
      .toBe('- [Arrays \\[and\\] slices \\\\ tips](https://santi020k.com/blog/a%20%28b%29/)')
  })

  test('formats sections and drops empty ones', () => {
    expect(formatLlmsSection('Pages', ['- [About](https://santi020k.com/about/)']))
      .toBe('## Pages\n\n- [About](https://santi020k.com/about/)')
    expect(formatLlmsSection('Series', [])).toBe('')
  })
})
