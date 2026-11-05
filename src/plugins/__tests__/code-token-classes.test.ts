import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { getCodeTokenClassName, rehypeCodeTokenClasses } from '../rehype-code-token-classes'

const span = (style: string | undefined, value: string, className?: string[]): Element => ({
  children: [{ type: 'text', value }],
  properties: { ...(style === undefined ? {} : { style }), ...(className ? { className } : {}) },
  tagName: 'span',
  type: 'element'
})

const code = (children: Element[]): Root => ({
  children: [{
    children: [{ children, properties: {}, tagName: 'code', type: 'element' }],
    properties: {},
    tagName: 'pre',
    type: 'element'
  }],
  type: 'root'
})

const transform = (tree: Root) => unified().use(rehypeCodeTokenClasses).runSync(tree)

const styleElements = (tree: Root) => tree.children.filter((node): node is Element => node.type === 'element' && node.tagName === 'style')

const textOf = (node: Element) => node.children.map((child: ElementContent) => child.type === 'text' ? child.value : '').join('')

describe('code token classes', () => {
  test('moves Shiki token variables into shared classes with one stylesheet', () => {
    const keyword = '--shiki-light:#5A1AB0;--shiki-light-font-style:italic;--shiki-dark:#9B69F6;--shiki-dark-font-style:italic'
    const plain = '--shiki-light:#302E36;--shiki-dark:#DFDDE3'
    const tokens = [span(keyword, 'const'), span(plain, ' value'), span(`${keyword};`, 'let', ['line-token']), span(plain, ' other')]
    const tree = transform(code(tokens))
    const keywordClass = getCodeTokenClassName(keyword)
    const plainClass = getCodeTokenClassName(plain)

    expect(tokens.map(token => token.properties)).toEqual([
      { className: [keywordClass] },
      { className: [plainClass] },
      { className: ['line-token', keywordClass] },
      { className: [plainClass] }
    ])

    const [stylesheet, ...extra] = styleElements(tree)
    const expected: [string, string][] = [[keywordClass, keyword], [plainClass, plain]]

    expect(extra).toEqual([])
    expect(stylesheet?.properties).toEqual({ dataCodeTokens: '', dataPagefindIgnore: 'all' })
    expect(stylesheet ? textOf(stylesheet) : '').toBe(expected
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([name, declarations]) => `.${name}{${declarations}}`)
      .join(''))
  })

  test('names classes deterministically from the declarations', () => {
    expect(getCodeTokenClassName('--shiki-light:#111;--shiki-dark:#eee'))
      .toBe(getCodeTokenClassName(' --shiki-light:#111; --shiki-dark:#eee; '))
    expect(getCodeTokenClassName('--shiki-light:#111;--shiki-dark:#eee')).toMatch(/^sk-[\da-f]{8}$/u)
  })

  test('leaves other inline styles and style-free documents unchanged', () => {
    const tokens = [span('color:red', 'warning'), span('--shiki-light:#111;color:red', 'mixed'), span(undefined, 'plain')]
    const tree = transform(code(tokens))

    expect(tokens.map(token => token.properties)).toEqual([
      { style: 'color:red' },
      { style: '--shiki-light:#111;color:red' },
      {}
    ])
    expect(styleElements(tree)).toEqual([])
  })
})
