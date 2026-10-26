import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeLumenCode } from '../rehype-lumen-code'

const element = (tagName: string, properties: Element['properties'] = {}, children: ElementContent[] = []): Element => ({
  children, properties, tagName, type: 'element'
})
const text = (value: string): ElementContent => ({ type: 'text', value })
const figure = (command = 'const value = 1', language = 'ts', label = ''): Element => element('figure', {
  dataRehypePrettyCodeFigure: ''
}, [
  ...(label ? [element('figcaption', { dataRehypePrettyCodeTitle: '', dataLanguage: language }, [text(label)])] : []),
  element('pre', { dataLanguage: language }, [element('code', {}, [
    element('span', { dataLine: '' }, [text(command)])
  ])])
])
const transform = (children: Element[], path = '/repo/src/content/post/example/index.md'): Root => unified()
  .use(rehypeLumenCode)
  .runSync({ children, type: 'root' }, { path })

describe('article Code folio', () => {
  test('folds grid-style lines without literal newlines while retaining code and unique targets', () => {
    const block = figure()
    const pre = block.children[0]
    if (pre?.type !== 'element') throw new Error('Missing pre')
    const code = pre.children[0]
    if (code?.type !== 'element') throw new Error('Missing code')
    const lines = Array.from({ length: 25 }, (_, index) => `const value${index} = ${index}`)
    code.properties.style = 'counter-set: line 19'
    code.children = lines.map((line, index) => element('span', { dataLine: '', id: `line-${index}` }, [text(line)]))
    const original = structuredClone(code.children)

    transform([block])

    const serialized = JSON.stringify(block)
    expect(serialized).toContain('dataExampleFold')
    expect(serialized).toContain('25 lines')
    expect(serialized.match(/"id":"line-0"/gu)).toHaveLength(1)
    expect(code.children).toEqual(original)
    expect(code.properties.style).toBe('counter-set: line 19')
    expect(serialized).toContain(JSON.stringify(lines.join('\n')))
  })

  test('preserves authored code, highlighting, and filenames while providing accessible copy states', () => {
    const block = figure('<script>literal & safe</script>', 'html', 'a/long/example.html')
    const pre = block.children.find(node => node.type === 'element' && node.tagName === 'pre')
    if (pre?.type !== 'element') throw new Error('Missing code fixture')
    const code = pre.children[0]
    if (code?.type !== 'element') throw new Error('Missing code fixture')
    code.properties = { dataLineNumbers: '', style: 'counter-set: line 19' }
    const originalLines = structuredClone(code.children)

    transform([block])

    expect(block.properties.dataArticleCodeFolio).toBe('')
    expect(code.children).toEqual(originalLines)
    expect(code.properties.style).toBe('counter-set: line 19')
    expect(pre.properties).toMatchObject({ ariaLabel: 'Code example 1: a/long/example.html', role: 'region', tabIndex: 0 })
    const serialized = JSON.stringify(block)
    expect(serialized).toContain('a/long/example.html')
    expect(serialized).toContain('Copy code to clipboard')
    expect(serialized).toContain('Could not copy code. Select and copy it manually.')
    expect(serialized).toContain('copy-idle')
    expect(serialized).toContain('copy-copied')
    expect(serialized).toContain('copy-error')
    const header = block.children[0]
    if (header?.type !== 'element') throw new Error('Missing header')
    const icon = header.children[0]
    expect(icon).toMatchObject({ tagName: 'svg', properties: { ariaHidden: 'true' } })
    if (icon?.type !== 'element') throw new Error('Missing icon')
    expect(icon.children.length).toBeGreaterThan(0)
    const cue = block.children.at(-1)
    expect(cue).toMatchObject({ tagName: 'div',
      properties: {
        dataScrollCueMessage: '', hidden: true, id: 'article-code-scroll-cue-1'
      } })
    expect(serialized).toContain('Scroll horizontally to read more')
    expect(pre.properties.ariaDescribedBy).toBeUndefined()
  })

  test('provides a useful label for plain text without altering its content', () => {
    const block = figure('an unlabelled example', '')
    transform([block])
    expect(JSON.stringify(block)).toContain('"value":"Code"')
    expect(JSON.stringify(block)).toContain('Code example 1: plain text')
    expect(JSON.stringify(block)).toContain('an unlabelled example')
  })

  test.each(['src/content/post/example.mdx', 'C:\\repo\\src\\content\\post\\example.md'])(
    'recognizes an article source path: %s', path => {
      const block = figure()
      transform([block], path)
      expect(block.properties.dataArticleCodeFolio).toBe('')
    }
  )

  test('retains the existing project code presentation', () => {
    const block = figure()
    transform([block], '/repo/src/content/project/example/index.md')
    expect(block.properties.dataArticleCodeFolio).toBeUndefined()
    expect(JSON.stringify(block)).toContain('ui-code__dots')
    expect(JSON.stringify(block)).not.toContain('article-code-scroll-cue')
  })

  test('retains package-manager alternatives and their copy controls without applying the standalone treatment', () => {
    const npm = figure('npm install example', 'sh')
    const pnpm = figure('pnpm add example', 'sh')
    const result = transform([npm, element('p', {}, [text('or')]), pnpm])
    expect(result.children).toHaveLength(1)
    expect(result.children[0]).toMatchObject({ properties: { dataPackageManagerCodeTabs: '', dataUiTabs: '' } })
    for (const block of [npm, pnpm]) {
      expect(block.properties.dataArticleCodeFolio).toBeUndefined()
      expect(JSON.stringify(block)).toContain('ui-code__dots')
      expect(JSON.stringify(block)).toContain('dataUiCodeCopy')
      expect(JSON.stringify(block)).not.toContain('article-code-scroll-cue')
    }
  })
})
