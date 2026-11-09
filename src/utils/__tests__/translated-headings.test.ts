import { describe, expect, test } from 'vitest'

import { preserveHeadingIds, translatedHeadings } from '../translated-headings'

describe('translated article anchors', () => {
  test('keeps English fragments with Spanish outline labels', () => {
    const { headings, ids } = translatedHeadings(
      [{ depth: 2, slug: 'inside-the-product', text: 'Inside the product' }],
      [{ depth: 2, slug: 'dentro-del-producto', text: 'Dentro del producto' }]
    )

    expect(headings).toEqual([{ depth: 2, slug: 'inside-the-product', text: 'Dentro del producto' }])
    expect(preserveHeadingIds('<h2 id="dentro-del-producto">Dentro del producto</h2>', ids))
      .toBe('<h2 id="inside-the-product">Dentro del producto</h2>')
  })

  test('does not rewrite code, scripts, or component identifiers', () => {
    const html = '<script>const example = \'<h2 id="translated">\'</script><pre>&lt;h2 id="translated"&gt;</pre><section id="translated"><h2 id="translated">Texto</h2></section>'

    expect(preserveHeadingIds(html, new Map([['translated', 'original']])))
      .toBe(html.replace('<h2 id="translated">Texto', '<h2 id="original">Texto'))
  })

  test('rejects missing sections and changed heading depth', () => {
    const original = [{ depth: 2, slug: 'original', text: 'Original' }]

    expect(() => translatedHeadings(original, [])).toThrow('heading structure')
    expect(() => translatedHeadings(original, [{ depth: 3, slug: 'translated', text: 'Traducido' }])).toThrow('different depth')
  })
})
