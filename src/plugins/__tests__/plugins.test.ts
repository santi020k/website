import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'
import type { VFile } from 'vfile'

import { remarkAdmonitions } from '../remark-admonitions'
import { remarkReadingTime } from '../remark-reading-time'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

describe('remarkReadingTime', () => {
  it('should calculate reading time and add it to frontmatter', () => {
    const processor = unified().use(remarkParse).use(remarkReadingTime).use(remarkStringify)
    const file = { data: { astro: { frontmatter: {} } } } as unknown as VFile
    const content = 'Hello world, this is a test page to check reading time calculation. It should have some min read.'

    const tree = processor.parse(content)
    remarkReadingTime()(tree as any, file)

    expect((file.data as any).astro.frontmatter.readingTime).toBeDefined()
    expect((file.data as any).astro.frontmatter.readingTime).toMatch(/min read/)
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

    const aside = tree.children[0] as any
    expect(aside.data.hName).toBe('aside')
    
    // Check properties - some hastscript versions use ariaLabel/className
    const props = aside.data.hProperties
    const label = props['aria-label'] || props.ariaLabel
    const className = props.class || props.className
    
    expect(label).toBe('note')
    if (Array.isArray(className)) {
      expect(className.join(' ')).toContain('aside-note')
    } else {
      expect(className).toContain('aside-note')
    }
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

    const aside = tree.children[0] as any
    const props = aside.data.hProperties
    const label = props['aria-label'] || props.ariaLabel
    expect(label).toBe('Custom Title')
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

    const result = tree.children[0] as any
    expect(result.type).toBe('paragraph')
    expect(result.children[0].type).toBe('text')
  })
})
