import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'

const element = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element', tagName, properties, children
})

const text = (value: string): ElementContent => ({ type: 'text', value })

/** Turn authored Markdown image titles into captions without replacing Astro's image node. */
export const rehypeArticleFigures: Plugin<[], Root> = () => (tree, file) => {
  const sourcePath = file.history.at(-1)?.replace(/\\/gu, '/')

  if (!sourcePath || !/(?:^|\/)src\/content\/post\//u.test(sourcePath) || /(?:^|\/)apps\//u.test(sourcePath)) return

  let number = 0

  tree.children = tree.children.map(node => {
    // Only standalone images opt in; existing figures, inline images and linked artwork retain their semantics.
    if (node.type !== 'element' || node.tagName !== 'img') return node

    const caption = typeof node.properties.title === 'string' ? node.properties.title.trim() : ''

    if (!caption) return node

    number += 1

    delete node.properties.title

    return element('figure', { dataArticleFigure: '' }, [
      node,
      element('figcaption', {}, [
        element('div', { dataFigureCopy: '' }, [
          element('span', { dataFigureLabel: '' }, [text('Figure'), element('span', { className: ['sr-only'] }, [text(` ${number}`)])]),
          element('p', { dataFigureCaption: '' }, [text(caption)])
        ]),
        element('span', { dataFigureNumber: '', ariaHidden: 'true' }, [text(String(number).padStart(2, '0'))])
      ])
    ])
  })
}
