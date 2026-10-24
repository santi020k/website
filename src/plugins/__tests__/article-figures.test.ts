import type { Element, ElementContent, Root } from 'hast'
import { unified } from 'unified'
import { describe, expect, test } from 'vitest'

import { rehypeArticleFigures } from '../rehype-article-figures'

const element = (tagName: string, children: ElementContent[] = []): Element => ({
  type: 'element', tagName, properties: {}, children
})
const image = (title = 'From layers to flat config.'): Element => ({
  ...element('img'),
  properties: {
    alt: 'Configuration layers linked to one flat configuration',
    src: './figure.webp',
    width: 1024,
    height: 574,
    loading: 'lazy',
    title
  }
})
const transform = (children: ElementContent[], path = '/repo/src/content/post/2024/eslint/index.md'): Root => unified()
  .use(rehypeArticleFigures)
  .runSync({ type: 'root', children }, { path })

const textContent = (node: ElementContent): string => {
  if (node.type === 'text') return node.value
  if (node.type === 'element') return node.children.map(textContent).join('')
  return ''
}

describe('article Caption spread figures', () => {
  test('preserves the image contract and puts the authored caption in a native figure', () => {
    const artwork = image('  From layers to flat config.  ')
    const original = structuredClone(artwork.properties)
    delete original.title
    const tree = transform([artwork])

    expect(artwork.properties).toEqual(original)
    expect(tree.children[0]).toMatchObject({
      tagName: 'figure',
      properties: { dataArticleFigure: '' },
      children: [
        artwork,
        { tagName: 'figcaption',
          children: [
            { tagName: 'div',
              children: [
                { tagName: 'span', children: [{ type: 'text', value: 'Figure' }, { children: [{ type: 'text', value: ' 1' }] }] },
                { tagName: 'p', children: [{ type: 'text', value: 'From layers to flat config.' }] }
              ] },
            { tagName: 'span', properties: { ariaHidden: 'true' }, children: [{ type: 'text', value: '01' }] }
          ] }
      ]
    })
  })

  test('numbers captioned images in article order and resets for each article', () => {
    const tree = transform([image(), image(' '), image('The migration path.')])
    expect(tree.children[0]).toMatchObject({ children: [expect.anything(), { children: [expect.anything(), { children: [{ value: '01' }] }] }] })
    expect(tree.children[2]).toMatchObject({ children: [expect.anything(), { children: [expect.anything(), { children: [{ value: '02' }] }] }] })
    expect(transform([image()]).children[0]).toMatchObject({ children: [expect.anything(), { children: [expect.anything(), { children: [{ value: '01' }] }] }] })
  })

  test('leaves images without captions, inline images, links and existing figures unchanged', () => {
    const withoutCaption = image()
    delete withoutCaption.properties.title
    const children = [withoutCaption, image(' '), element('p', [image()]), element('a', [image()]), element('figure', [image()])]
    const before = structuredClone(children)
    expect(transform(children).children).toEqual(before)
  })

  test('does not rewrap generated figures on a second pass', () => {
    const tree = transform([image(), image('Second figure.')])
    const before = structuredClone(tree)
    unified().use(rehypeArticleFigures).runSync(tree, { path: '/repo/src/content/post/2024/eslint/index.md' })
    expect(tree).toEqual(before)
  })

  test('handles Windows post paths and MDX while excluding projects and archived posts', () => {
    expect(transform([image()], 'C:\\repo\\src\\content\\post\\2024\\example\\index.mdx').children[0]).toMatchObject({ tagName: 'figure' })
    for (const path of ['/repo/src/content/project/example/index.md', '/repo/apps/v3/src/content/post/example.md']) {
      const artwork = image()
      expect(transform([artwork], path).children[0]).toEqual(artwork)
    }
  })

  test('ignores anonymous documents and keeps caption markup as literal text', () => {
    const artwork = image('<script>alert(1)</script> & details')
    const anonymous: Root = { type: 'root', children: [structuredClone(artwork)] }
    unified().use(rehypeArticleFigures).runSync(anonymous)
    expect(anonymous.children).toEqual([artwork])
    const tree = transform([artwork])
    const figure = tree.children[0]
    if (figure?.type !== 'element') throw new TypeError('Expected a figure')
    expect(textContent(figure)).toContain('<script>alert(1)</script> & details')
    expect(JSON.stringify(tree)).not.toContain('"tagName":"script"')
  })
})
