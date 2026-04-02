import type { Paragraph, Text } from 'mdast'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import type { VFile } from 'vfile'
import { describe, expect, it } from 'vitest'

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

interface AdmonitionData {
  hName: string
  hProperties: Record<string, string | string[] | undefined>
}

interface AdmonitionNode extends Paragraph {
  data: AdmonitionData
}

describe('remarkReadingTime', () => {
  it('should calculate reading time and add it to frontmatter', () => {
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
  it('should transform note container directives into aside elements', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':::note\nThis is a note\n:::'
    const tree = processor.parse(content)
    await processor.run(tree)

    const aside = tree.children[0] as AdmonitionNode
    expect(aside.data.hName).toBe('aside')

    // Check properties - handles both 'class' and 'className' conventions
    const props = aside.data.hProperties
    const className = props.class ?? props.className
    const classNameString = Array.isArray(className) ? className.join(' ') : (className ?? '')

    expect(classNameString).toContain('aside-note')
    expect(props['aria-label'] ?? props.ariaLabel).toBe('note')
  })

  it('should handle custom titles via directive labels', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':::tip[Custom Title]\nTip content\n:::'
    const tree = processor.parse(content)
    await processor.run(tree)

    const aside = tree.children[0] as AdmonitionNode
    const props = aside.data.hProperties
    expect(props['aria-label'] ?? props.ariaLabel).toBe('Custom Title')
  })

  it('should transform unhandled directives to normal text', async () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkAdmonitions)
      .use(remarkStringify)

    const content = ':unknown[label]'
    const tree = processor.parse(content)
    await processor.run(tree)

    const result = tree.children[0] as Paragraph
    expect(result.type).toBe('paragraph')
    expect((result.children[0] as Text).type).toBe('text')
  })
})
