// cspell:words colspan rowspan
import type { DefaultTreeAdapterTypes } from 'parse5'
import { defaultTreeAdapter, html, parseFragment, serialize } from 'parse5'

type ChildNode = DefaultTreeAdapterTypes.ChildNode

type Element = DefaultTreeAdapterTypes.Element

type ParentNode = DefaultTreeAdapterTypes.ParentNode

/** Page controls, icons and scripts that mean nothing in a feed reader or an email. */
const droppedTags = new Set([
  'button',
  'dialog',
  'form',
  'iframe',
  'input',
  'label',
  'nav',
  'noscript',
  'script',
  'select',
  'source',
  'style',
  'svg',
  'template',
  'textarea'
])

/** Wrappers that only carry styling hooks; their content stays. */
const unwrappedTags = new Set(['picture', 'span'])
/** Blocks removed once nothing readable is left inside them. */
const removableWhenEmpty = new Set(['div', 'figcaption', 'figure', 'p', 'section'])

/** The few attributes a reader or an email client can use, by element. Everything else is dropped. */
const keptAttributes: Readonly<Record<string, ReadonlySet<string>>> = {
  a: new Set(['href', 'title']),
  abbr: new Set(['title']),
  img: new Set(['alt', 'height', 'src', 'title', 'width']),
  ol: new Set(['reversed', 'start']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  time: new Set(['datetime'])
}

const urlAttributes = new Set(['href', 'src'])
const isElement = (node: ChildNode): node is Element => 'tagName' in node
const isText = (node: ChildNode): node is DefaultTreeAdapterTypes.TextNode => node.nodeName === '#text'
const getAttribute = (element: Element, name: string) => element.attrs.find(attribute => attribute.name === name)?.value
/**
 * Page furniture, not part of the text: hidden tab panels, decorative icons, print-only reference
 * numbers, the article's format label ("Opinion", "Guide"), a code block's language badge, and the
 * short preview shown beside a folded code example (the full example is kept instead).
 */
const droppedMarkers = ['data-article-format', 'data-code-preview', 'data-print-reference', 'data-prose-code-language']

const isDropped = (element: Element) => droppedTags.has(element.tagName) ||
  getAttribute(element, 'hidden') !== undefined ||
  getAttribute(element, 'aria-hidden') === 'true' ||
  droppedMarkers.some(marker => getAttribute(element, marker) !== undefined)

/** A folded code example opens in place: its full code stays and the expand control goes. */
const isCodeFold = (element: Element) => element.tagName === 'details' && getAttribute(element, 'data-example-fold') !== undefined

const textContent = (node: ChildNode): string => {
  if (isText(node)) return node.value

  if (!isElement(node) || isDropped(node)) return ''

  return node.childNodes.map(child => textContent(child)).join('')
}

const absoluteURL = (value: string, base: URL) => {
  try {
    return new URL(value, base).href
  } catch {
    return value
  }
}

/** Highlighted code becomes plain preformatted text: token classes have no stylesheet in a reader. */
const flattenCode = (pre: Element) => {
  const code = defaultTreeAdapter.createElement('code', html.NS.HTML, [])

  defaultTreeAdapter.insertText(code, pre.childNodes.map(child => textContent(child)).join('').replace(/\n+$/u, ''))

  pre.childNodes = []

  defaultTreeAdapter.appendChild(pre, code)
}

const cleanAttributes = (element: Element, base: URL) => {
  const kept = keptAttributes[element.tagName]

  element.attrs = element.attrs
    .filter(attribute => kept?.has(attribute.name) === true)
    .map(attribute => urlAttributes.has(attribute.name) ?
      { ...attribute, value: absoluteURL(attribute.value, base) } :
      attribute)
}

const isBlank = (element: Element) => element.childNodes.every(child => isText(child) && child.value.trim() === '')

const cleanChildren = (parent: ParentNode, base: URL): ChildNode[] => parent.childNodes.flatMap(child => {
  if (isText(child)) return [child]

  if (!isElement(child) || isDropped(child)) return []

  if (child.tagName === 'pre') {
    flattenCode(child)

    child.attrs = []

    return [child]
  }

  if (isCodeFold(child)) {
    child.childNodes = child.childNodes.filter(node => !isElement(node) || node.tagName !== 'summary')
  }

  const children = cleanChildren(child, base)

  if (unwrappedTags.has(child.tagName) || isCodeFold(child)) {
    for (const node of children) node.parentNode = parent

    return children
  }

  child.childNodes = children

  for (const node of children) node.parentNode = child

  cleanAttributes(child, base)

  return removableWhenEmpty.has(child.tagName) && isBlank(child) ? [] : [child]
})

/**
 * Turns an article body rendered for the page into portable HTML for RSS and JSON Feed readers and
 * newsletter email: page controls go, highlighted code becomes plain text, styling attributes are
 * dropped, and links and images point at absolute URLs resolved against the article's own address.
 */
export const toFeedHtml = (articleHtml: string, articleUrl: URL): string => {
  const fragment = parseFragment(articleHtml)

  fragment.childNodes = cleanChildren(fragment, articleUrl)

  return serialize(fragment).replace(/\n{3,}/gu, '\n\n').trim()
}
