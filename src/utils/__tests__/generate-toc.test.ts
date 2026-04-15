import { describe, expect, it } from 'vitest'

import type { TocItem } from '../generate-toc'
import { generateToc } from '../generate-toc'

// Helper to build a minimal MarkdownHeading-compatible object
const h = (depth: number, slug: string, text: string = slug) => ({ depth, slug, text })
const expectDefined = <T>(value: T | undefined): T => {
  expect(value).toBeDefined()

  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }

  return value
}

describe('generateToc', () => {
  it('returns an empty array for an empty headings list', () => {
    expect(generateToc([])).toEqual([])
  })

  it('returns a flat list when all headings are the same depth', () => {
    const headings = [h(2, 'intro'), h(2, 'middle'), h(2, 'end')]
    const toc = generateToc(headings)

    expect(toc).toHaveLength(3)
    expect(toc.map(item => item.slug)).toEqual(['intro', 'middle', 'end'])
    expect(toc.every(item => item.children.length === 0)).toBe(true)
  })

  it('nests an h3 under the preceding h2', () => {
    const headings = [h(2, 'parent'), h(3, 'child')]
    const toc = generateToc(headings)
    const parent = expectDefined(toc[0])
    const child = expectDefined(parent.children[0])

    expect(toc).toHaveLength(1)
    expect(parent.slug).toBe('parent')
    expect(parent.children).toHaveLength(1)
    expect(child.slug).toBe('child')
  })

  it('handles alternating parents and children correctly', () => {
    const headings = [
      h(2, 'first'),
      h(3, 'first-child'),
      h(2, 'second'),
      h(3, 'second-child')
    ]
    const toc = generateToc(headings)
    const first = expectDefined(toc[0])
    const second = expectDefined(toc[1])
    const firstChild = expectDefined(first.children[0])
    const secondChild = expectDefined(second.children[0])

    expect(toc).toHaveLength(2)
    expect(firstChild.slug).toBe('first-child')
    expect(secondChild.slug).toBe('second-child')
  })

  it('builds a three-level nested tree correctly', () => {
    const headings = [h(2, 'h2'), h(3, 'h3'), h(4, 'h4')]
    const toc = generateToc(headings)
    const level2 = expectDefined(toc[0])
    const level3 = expectDefined(level2.children[0])
    const level4 = expectDefined(level3.children[0])

    expect(toc).toHaveLength(1)
    expect(level2.slug).toBe('h2')
    expect(level2.children).toHaveLength(1)
    expect(level3.slug).toBe('h3')
    expect(level3.children).toHaveLength(1)
    expect(level4.slug).toBe('h4')
  })

  it('preserves the text property on each TocItem', () => {
    const headings = [h(2, 'intro', 'Introduction')]
    const toc = generateToc(headings)

    expect(expectDefined(toc[0]).text).toBe('Introduction')
  })
})

describe('generateToc — minHeadingLevel', () => {
  it('excludes headings shallower than minHeadingLevel', () => {
    const headings = [h(1, 'title'), h(2, 'section'), h(3, 'sub')]
    const toc = generateToc(headings, { minHeadingLevel: 2 })

    expect(toc.map(item => item.slug)).not.toContain('title')
    expect(toc.map(item => item.slug)).toContain('section')
  })

  it('returns empty when all headings are below minHeadingLevel', () => {
    const headings = [h(1, 'a'), h(2, 'b')]
    expect(generateToc(headings, { minHeadingLevel: 3 })).toEqual([])
  })
})

describe('generateToc — maxHeadingLevel', () => {
  it('excludes headings deeper than maxHeadingLevel', () => {
    const headings = [h(2, 'section'), h(3, 'sub'), h(4, 'deep')]
    const toc = generateToc(headings, { maxHeadingLevel: 3 })

    const allSlugs = (items: TocItem[]): string[] => items.flatMap(item => [item.slug, ...allSlugs(item.children)])

    expect(allSlugs(toc)).not.toContain('deep')
    expect(allSlugs(toc)).toContain('sub')
  })

  it('returns a single item when maxHeadingLevel matches the only heading depth', () => {
    const headings = [h(2, 'only'), h(3, 'excluded')]
    const toc = generateToc(headings, { maxHeadingLevel: 2 })
    const only = expectDefined(toc[0])

    expect(toc).toHaveLength(1)
    expect(only.children).toHaveLength(0)
  })
})

describe('generateToc — combined min/max constraints', () => {
  it('only includes headings within the specified range', () => {
    const headings = [h(1, 'h1'), h(2, 'h2'), h(3, 'h3'), h(4, 'h4'), h(5, 'h5')]
    const toc = generateToc(headings, { minHeadingLevel: 2, maxHeadingLevel: 3 })

    const allSlugs = (items: TocItem[]): string[] => items.flatMap(item => [item.slug, ...allSlugs(item.children)])
    const slugs = allSlugs(toc)

    expect(slugs).not.toContain('h1')
    expect(slugs).toContain('h2')
    expect(slugs).toContain('h3')
    expect(slugs).not.toContain('h4')
    expect(slugs).not.toContain('h5')
  })
})
