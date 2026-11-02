import { createHash } from 'node:crypto'

import type { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/** Shiki writes each token's dual-theme colors as inline custom properties, nothing else. */
const shikiTokenStyle = /^\s*--shiki-[\w-]+\s*:[^;]+(?:;\s*--shiki-[\w-]+\s*:[^;]+)*;?\s*$/u

const normalizeDeclarations = (style: string): string => style
  .split(';')
  .map(declaration => declaration.trim())
  .filter(Boolean)
  .join(';')

/** Token classes stay stable across builds, so the same token style always maps to one class. */
const declarationsByToken = new Map<string, string>()

/** Returns the shared class for a token style, failing on the (unlikely) event of a hash collision. */
export const getCodeTokenClassName = (style: string): string => {
  const declarations = normalizeDeclarations(style)
  const digest = createHash('sha256').update(declarations).digest('hex').slice(0, 8)
  const token = ['sk', digest].join('-')
  const registered = declarationsByToken.get(token)

  if (registered !== undefined && registered !== declarations) {
    throw new Error(`Code token class ${token} would describe both "${registered}" and "${declarations}".`)
  }

  declarationsByToken.set(token, declarations)

  return token
}

const classList = (node: Element): string[] => {
  const value = node.properties.className

  return Array.isArray(value) ? value.map(String) : []
}

/**
 * Moves Shiki's per-token inline color variables into shared classes. A long article repeats
 * the same couple dozen styles across more than a thousand spans; each document now carries
 * one small stylesheet with only the classes it uses. Lumen's code styles keep reading the same
 * `--shiki-*` variables, so both themes render exactly as before.
 */
export const rehypeCodeTokenClasses: Plugin<[], Root> = () => tree => {
  const used = new Map<string, string>()

  visit(tree, 'element', node => {
    if (node.tagName !== 'span') return

    const { style } = node.properties

    if (typeof style !== 'string' || !shikiTokenStyle.test(style)) return

    const token = getCodeTokenClassName(style)

    used.set(token, normalizeDeclarations(style))

    delete node.properties.style

    node.properties.className = [...classList(node), token]
  })

  if (used.size === 0) return

  const css = [...used]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([token, declarations]) => `.${token}{${declarations}}`)
    .join('')

  tree.children.push({
    children: [{ type: 'text', value: css }],
    properties: { dataCodeTokens: '', dataPagefindIgnore: 'all' },
    tagName: 'style',
    type: 'element'
  })
}
