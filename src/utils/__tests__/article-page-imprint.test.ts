import { describe, expect, test } from 'vitest'

import { getArticlePageImprint, getArticlePrintLabel } from '../article-page-imprint'

describe('article Page imprint', () => {
  test('uses the authored title with normalized spacing', () => {
    expect(getArticlePrintLabel('  A useful\n article\t title  ')).toBe('santi020k · A useful article title')
    expect(getArticlePrintLabel('')).toBe('santi020k · Article')
  })

  test('shortens long titles at a word boundary and preserves Unicode characters', () => {
    const title = 'A complete guide to building accessible interfaces with reusable components and reliable delivery workflows'
    const label = getArticlePrintLabel(title)

    expect(label).toBe('santi020k · A complete guide to building accessible interfaces with reusable components and reliable…')
    expect(getArticlePrintLabel(`${'a'.repeat(96)} next`)).toBe(`santi020k · ${'a'.repeat(96)}…`)
    expect(Array.from(getArticlePrintLabel('𐐀'.repeat(120)).replace('santi020k · ', ''))).toHaveLength(97)
  })

  test('keeps quotes, backslashes, markup and control characters inside one CSS string', () => {
    const css = getArticlePageImprint('A "title" \\ </style><script>oops</script>\u0000')

    expect(css).not.toContain('<')
    expect(css).not.toContain('>')
    expect(css).not.toContain('\u0000')
    expect(css).toContain('\\22 title\\22 ')
    expect(css).toContain('\\5c ')
    expect(css).toContain('\\3c /style\\3e ')
    expect(css).toContain('\\0 ')
  })
})
