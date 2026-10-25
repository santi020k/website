import { getProjectChapters } from '@/utils/project-chapters'

import type { MarkdownHeading } from 'astro'
import { expect, test } from 'vitest'

const heading = (depth: number, slug: string): MarkdownHeading => ({ depth, slug, text: slug })

test('groups sections under their owning chapter without losing document order', () => {
  const headings = [heading(2, 'intro'), heading(2, 'first'), heading(3, 'scope'), heading(4, 'detail'), heading(3, 'results'), heading(2, 'second'), heading(3, 'preview')]
  const chapters = getProjectChapters(headings)

  expect(chapters.map(chapter => [chapter.heading.slug, chapter.sections.map(section => section.slug)]))
    .toEqual([['intro', []], ['first', ['scope', 'results']], ['second', ['preview']]])
  expect(headings.map(item => item.slug)).toEqual(['intro', 'first', 'scope', 'detail', 'results', 'second', 'preview'])
})

test('keeps leading third-level headings reachable without inventing a parent', () => {
  expect(getProjectChapters([heading(3, 'first'), heading(3, 'second'), heading(2, 'chapter'), heading(3, 'child')]))
    .toEqual([
      { heading: heading(3, 'first'), sections: [] },
      { heading: heading(3, 'second'), sections: [] },
      { heading: heading(2, 'chapter'), sections: [heading(3, 'child')] }
    ])
})

test('does not manufacture chapters for an empty or deeper-only outline', () => {
  expect(getProjectChapters([])).toEqual([])
  expect(getProjectChapters([heading(4, 'detail')])).toEqual([])
})
