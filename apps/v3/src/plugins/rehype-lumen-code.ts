import type { Element, ElementContent, Root, RootContent, Text } from 'hast'
import type { Plugin } from 'unified'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'

const element = (
  tagName: string,
  properties: Element['properties'] = {},
  children: ElementContent[] = []
): Element => ({ children, properties, tagName, type: 'element' })

const text = (value: string): Text => ({ type: 'text', value })

const classNames = (node: Element): string[] => {
  const value = node.properties.className

  if (Array.isArray(value)) return value.map(String)

  return []
}

const dataProperty = (node: Element, property: string): unknown => {
  const kebabName = `data-${property}`

  const camelName = `data${property.replaceAll(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase())
    .replace(/^./u, letter => letter.toUpperCase())}`

  return Reflect.get(node.properties, kebabName) ?? Reflect.get(node.properties, camelName)
}

const isElement = (node: Node): node is Element => node.type === 'element' &&
  'tagName' in node &&
  'properties' in node &&
  'children' in node

const isPrettyCodeFigure = (node: Node): node is Element => isElement(node) &&
  node.tagName === 'figure' &&
  dataProperty(node, 'rehype-pretty-code-figure') !== undefined

const nodeText = (node: RootContent | ElementContent): string => {
  if (node.type === 'text') return node.value

  if ('children' in node) return node.children.map(child => nodeText(child)).join('')

  return ''
}

const copyIcon = () => element('svg', {
  ariaHidden: 'true',
  className: ['ui-icon__svg', 'lucide-copy', 'ui-code__copy-icon'],
  fill: 'none',
  focusable: 'false',
  height: '1em',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: '2',
  viewBox: '0 0 24 24',
  width: '1em',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  element('rect', { height: '14', rx: '2', ry: '2', width: '14', x: '8', y: '8' }),
  element('path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' })
])

const checkIcon = () => element('svg', {
  ariaHidden: 'true',
  className: ['ui-icon__svg', 'lucide-check', 'ui-code__check-icon'],
  fill: 'none',
  focusable: 'false',
  height: '1em',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: '2',
  viewBox: '0 0 24 24',
  width: '1em',
  xmlns: 'http://www.w3.org/2000/svg'
}, [
  element('path', { d: 'M20 6 9 17l-5-5' })
])

const getCodeMetadata = (figure: Element) => {
  const title = figure.children.find(child => (
    child.type === 'element' &&
    dataProperty(child, 'rehype-pretty-code-title') !== undefined
  ))

  const pre = figure.children.find(child => child.type === 'element' && child.tagName === 'pre')

  const language = (
    title?.type === 'element' ? dataProperty(title, 'language') : undefined
  ) ?? (
    pre?.type === 'element' ? dataProperty(pre, 'language') : undefined
  )

  return {
    label: title ? nodeText(title).trim() : '',
    language: typeof language === 'string' ? language : '',
    pre: pre?.type === 'element' ? pre : undefined
  }
}

const getCodeElement = (figure: Element): Element | undefined => {
  const { pre } = getCodeMetadata(figure)

  const code = pre?.children.find(child => (
    child.type === 'element' && child.tagName === 'code'
  ))

  return code?.type === 'element' ? code : undefined
}

const createHeader = (language: string, label: string): Element => {
  const metadata: ElementContent[] = []

  if (language) {
    metadata.push(element('span', { className: ['ui-code__language'] }, [text(language)]))
  }

  if (label) {
    metadata.push(element('span', { className: ['ui-code__label'] }, [text(label)]))
  }

  return element('figcaption', { className: ['ui-code__header'] }, [
    element('span', { ariaHidden: 'true', className: ['ui-code__dots'] }, [
      element('span', { className: ['ui-code__dot', 'ui-code__dot--red'] }),
      element('span', { className: ['ui-code__dot', 'ui-code__dot--yellow'] }),
      element('span', { className: ['ui-code__dot', 'ui-code__dot--green'] })
    ]),
    element('span', { className: ['ui-code__meta'] }, metadata),
    element('button', {
      ariaLabel: 'Copy code to clipboard',
      className: ['ui-code__copy'],
      dataUiCodeCopy: '',
      type: 'button'
    }, [copyIcon(), checkIcon()])
  ])
}

const convertFigure = (figure: Element): void => {
  const { label, language, pre } = getCodeMetadata(figure)

  figure.properties.className = [...classNames(figure), 'ui-code', 'ui-code--block']

  figure.properties.dataCodeTheme = 'santi020k'

  figure.properties.dataLanguage = language

  figure.properties.dataUiCode = ''

  if (pre) {
    pre.properties.tabIndex = 0
  }

  figure.children = [
    createHeader(language, label),
    ...figure.children.filter(child => (
      child.type !== 'element' ||
      dataProperty(child, 'rehype-pretty-code-title') === undefined
    ))
  ]
}

const packageManager = (figure: Element): string | undefined => {
  const { pre } = getCodeMetadata(figure)
  const command = pre ? nodeText(pre).trimStart() : ''

  return /^(bun|npm|pnpm|yarn)(?=\s)/u.exec(command)?.[1]
}

const isOrParagraph = (node: RootContent | undefined): boolean => node?.type === 'element' &&
  node.tagName === 'p' &&
  nodeText(node).trim().toLowerCase() === 'or'

const nextContentIndex = (children: RootContent[], start: number): number => {
  for (let index = start; index < children.length; index += 1) {
    const node = children.at(index)

    if (node?.type !== 'text' || node.value.trim()) return index
  }

  return -1
}

const createCodeTabs = (figures: [Element, Element], labels: [string, string]): Element => {
  const values = labels.map(label => label.toLowerCase())

  return element('div', {
    className: ['ui-tabs', 'ui-code-tabs'],
    dataInitialValue: values.at(0) ?? '',
    dataUiTabs: ''
  }, [
    element('div', {
      ariaLabel: 'Package manager',
      className: ['ui-code-tabs__list'],
      role: 'tablist'
    }, labels.map((label, index) => element('button', {
      ariaSelected: index === 0 ? 'true' : 'false',
      className: ['ui-code-tabs__tab'],
      dataValue: values.at(index) ?? '',
      role: 'tab',
      type: 'button'
    }, [text(label)]))),
    ...figures.map((figure, index) => element('div', {
      className: ['ui-code-tabs__panel'],
      dataValue: values.at(index) ?? '',
      hidden: index > 0,
      role: 'tabpanel'
    }, [figure]))
  ])
}

const trimLineWhitespace = (children: ElementContent[]): ElementContent[] => {
  const trimmed = [...children]

  while (trimmed.length > 0) {
    const first = trimmed.at(0)

    if (first?.type !== 'text' || first.value.trim()) break

    trimmed.shift()
  }

  while (trimmed.length > 0) {
    const last = trimmed.at(-1)

    if (last?.type !== 'text' || last.value.trim()) break

    trimmed.pop()
  }

  return trimmed
}

const splitInlinePackageAlternatives = (parent: Root | Element): void => {
  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children.at(index)

    if (!child || !isPrettyCodeFigure(child)) continue

    const code = getCodeElement(child)

    const separatorIndex = code?.children.findIndex(line => (
      /^#\s*or$/iu.test(nodeText(line).trim())
    )) ?? -1

    if (!code || separatorIndex < 0) continue

    const first = structuredClone(child)
    const second = structuredClone(child)
    const firstCode = getCodeElement(first)
    const secondCode = getCodeElement(second)

    if (!firstCode || !secondCode) continue

    firstCode.children = trimLineWhitespace(code.children.slice(0, separatorIndex))

    secondCode.children = trimLineWhitespace(code.children.slice(separatorIndex + 1))

    const firstManager = packageManager(first)
    const secondManager = packageManager(second)

    if (!firstManager || !secondManager || firstManager === secondManager) continue

    parent.children.splice(
      index, 1, createCodeTabs([first, second], [firstManager, secondManager])
    )
  }
}

const groupChildren = (parent: Root | Element): void => {
  for (let index = 0; index < parent.children.length; index += 1) {
    const first = parent.children.at(index)

    if (!first || !isPrettyCodeFigure(first)) continue

    const separatorIndex = nextContentIndex(parent.children, index + 1)
    const secondIndex = nextContentIndex(parent.children, separatorIndex + 1)
    const separator = parent.children.at(separatorIndex)
    const second = parent.children.at(secondIndex)

    if (!second || !isPrettyCodeFigure(second)) continue

    if (!isOrParagraph(separator)) continue

    const firstManager = packageManager(first)
    const secondManager = packageManager(second)

    if (!firstManager || !secondManager || firstManager === secondManager) continue

    parent.children.splice(
      index, secondIndex - index + 1, createCodeTabs([first, second], [firstManager, secondManager])
    )
  }
}

const groupPackageManagerAlternatives = (tree: Root): void => {
  splitInlinePackageAlternatives(tree)

  groupChildren(tree)

  visit(tree, 'element', node => {
    splitInlinePackageAlternatives(node)

    groupChildren(node)
  })
}

/**
 * Adapts Rehype Pretty Code output to Lumen's Code and CodeTabs public DOM
 * contracts while retaining Shiki's syntax-highlighted children.
 */
export const rehypeLumenCode: Plugin<[], Root> = () => tree => {
  groupPackageManagerAlternatives(tree)

  visit(tree, 'element', node => {
    if (isPrettyCodeFigure(node)) convertFigure(node)
  })
}
