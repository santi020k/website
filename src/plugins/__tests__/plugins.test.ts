import type { Element, Root as HastRoot } from 'hast'
import type { Paragraph, Text } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { VFile } from 'vfile'
import { describe, expect, test } from 'vitest'

import { rehypeLumenCode } from '../rehype-lumen-code'
import { remarkAdmonitions } from '../remark-admonitions'
import { remarkReadingTime } from '../remark-reading-time'

interface AstroVFile extends VFile {
  data: {
    astro?: {
      frontmatter: {
        readingTime?: string
        [key: string]: unknown
      }
    }
  }
}

interface AdmonitionData extends NonNullable<Paragraph['data']> {
  hName: string
  hProperties: Record<string, string | string[] | undefined>
}

interface AdmonitionNode extends Paragraph {
  data: AdmonitionData
}

describe('remarkReadingTime', () => {
  test('should calculate reading time and add it to frontmatter', () => {
    const processor = unified().use(remarkParse).use(remarkReadingTime).use(remarkStringify)
    const file = { data: { astro: { frontmatter: {} } } } as unknown as AstroVFile
    const content = 'Hello world, this is a test page to check reading time calculation. It should have some min read.'

    const tree = processor.parse(content)
    remarkReadingTime()(tree, file)

    expect(file.data.astro?.frontmatter.readingTime).toBeDefined()
    expect(file.data.astro?.frontmatter.readingTime).toMatch(/min read/)
  })
})

describe('remarkAdmonitions', () => {
  test('should transform note container directives into aside elements', () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':::note\nThis is a note\n:::'
    const tree = processor.parse(content)
    processor.runSync(tree)

    const aside = tree.children[0] as AdmonitionNode
    expect(aside.data.hName).toBe('aside')

    // Check properties - handles both 'class' and 'className' conventions
    const props = aside.data.hProperties
    const className = props.class ?? props.className
    const classNameString = Array.isArray(className) ? className.join(' ') : (className ?? '')

    expect(classNameString).toContain('aside-note')
    expect(props['aria-label'] ?? props.ariaLabel).toBe('note')
  })

  test('should handle custom titles via directive labels', () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':::tip[Custom Title]\nTip content\n:::'
    const tree = processor.parse(content)
    processor.runSync(tree)

    const aside = tree.children[0] as AdmonitionNode
    const props = aside.data.hProperties
    expect(props['aria-label'] ?? props.ariaLabel).toBe('Custom Title')
  })

  test('should transform unhandled directives to normal text', () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':unknown[label]'
    const tree = processor.parse(content)
    processor.runSync(tree)

    const result = tree.children[0] as Paragraph
    expect(result.type).toBe('paragraph')
    expect((result.children[0] as Text).type).toBe('text')
  })
})

const codeFigure = (manager: string, language = 'bash'): Element => ({
  children: [
    {
      children: [{ type: 'text', value: 'terminal' }],
      properties: {
        'data-language': language,
        'data-rehype-pretty-code-title': ''
      },
      tagName: 'figcaption',
      type: 'element'
    },
    {
      children: [{
        children: [{ type: 'text', value: `${manager} install package` }],
        properties: {},
        tagName: 'code',
        type: 'element'
      }],
      properties: { 'data-language': language },
      tagName: 'pre',
      type: 'element'
    }
  ],
  properties: { 'data-rehype-pretty-code-figure': '' },
  tagName: 'figure',
  type: 'element'
})

const inlineAlternativeFigure = (): Element => {
  const figure = codeFigure('npm')
  const pre = figure.children[1] as Element
  const code = pre.children[0] as Element

  code.children = [
    {
      children: [{ type: 'text', value: 'npm install package' }],
      properties: { dataLine: '' },
      tagName: 'span',
      type: 'element'
    },
    { type: 'text', value: '\n' },
    {
      children: [{ type: 'text', value: '# or' }],
      properties: { dataLine: '' },
      tagName: 'span',
      type: 'element'
    },
    { type: 'text', value: '\n' },
    {
      children: [{ type: 'text', value: 'yarn add package' }],
      properties: { dataLine: '' },
      tagName: 'span',
      type: 'element'
    }
  ]

  return figure
}

const hastText = (node: Element): string => node.children.map(child => {
  if (child.type === 'text') return child.value

  if (child.type === 'element') return hastText(child)

  return ''
}).join('')

describe('rehypeLumenCode', () => {
  test('adapts highlighted figures to the Lumen Code contract', () => {
    const tree: HastRoot = { children: [codeFigure('npm')], type: 'root' }
    const processor = unified().use(rehypeLumenCode)

    processor.runSync(tree)

    const figure = tree.children[0] as Element
    const header = figure.children[0] as Element

    expect(figure.properties.className).toEqual(['ui-code', 'ui-code--block'])
    expect(figure.properties.dataLanguage).toBe('bash')
    expect(figure.properties.dataUiCode).toBe('')
    expect(header.properties.className).toEqual(['ui-code__header'])
  })

  test('groups adjacent package-manager alternatives into Lumen CodeTabs', () => {
    const tree: HastRoot = {
      children: [
        codeFigure('npm'),
        { type: 'text', value: '\n' },
        {
          children: [{ type: 'text', value: 'Or' }],
          properties: {},
          tagName: 'p',
          type: 'element'
        },
        { type: 'text', value: '\n' },
        codeFigure('yarn')
      ],
      type: 'root'
    }
    const processor = unified().use(rehypeLumenCode)

    processor.runSync(tree)

    const tabs = tree.children[0] as Element

    expect(tree.children).toHaveLength(1)
    expect(tabs.properties.className).toEqual(['ui-tabs', 'ui-code-tabs'])
    expect(tabs.properties.dataUiTabs).toBe('')
    expect(tabs.children).toHaveLength(3)
  })

  test('splits inline package-manager alternatives into Lumen CodeTabs', () => {
    const tree: HastRoot = { children: [inlineAlternativeFigure()], type: 'root' }
    const processor = unified().use(rehypeLumenCode)

    processor.runSync(tree)

    const tabs = tree.children[0] as Element
    const firstPanel = tabs.children[1] as Element
    const secondPanel = tabs.children[2] as Element

    expect(tabs.properties.className).toEqual(['ui-tabs', 'ui-code-tabs'])
    expect(firstPanel.properties.dataValue).toBe('npm')
    expect(hastText(firstPanel)).toContain('npm install package')
    expect(hastText(firstPanel)).not.toContain('# or')
    expect(secondPanel.properties.dataValue).toBe('yarn')
    expect(hastText(secondPanel)).toContain('yarn add package')
  })
})
