// @vitest-environment node
import { describe, expect, test } from 'vitest'

import { findUnpublished, readPosts, readPublication } from '../check-scheduled-posts.mjs'

const post = (frontmatter: string) => `---\ntitle: "Post"\n${frontmatter}\n---\n\nBody with draft: true and publishDate: "1999-01-01" in prose.\n`

describe('scheduled publication check', () => {
  test('reads the publication date and draft flag from frontmatter only', () => {
    expect(readPublication(post('publishDate: "2027-01-05T14:00:00.000Z"\ndraft: true'))).toEqual({
      draft: true,
      publishDate: new Date('2027-01-05T14:00:00.000Z')
    })
    expect(readPublication(post('publishDate: 2026-10-06'))).toEqual({ draft: false, publishDate: new Date('2026-10-06') })
    expect(readPublication(post('publishDate: "soon"')).publishDate).toBeUndefined()
    expect(readPublication('No frontmatter')).toEqual({ draft: false, publishDate: undefined })
  })

  test('asks for a deployment only for due posts production does not list', () => {
    const now = new Date('2027-01-05T14:10:00.000Z')

    const posts = [
      { slug: 'live', draft: false, publishDate: new Date('2026-01-01') },
      { slug: 'due', draft: false, publishDate: new Date('2027-01-05T14:00:00.000Z') },
      { slug: 'later', draft: false, publishDate: new Date('2027-02-01') },
      { slug: 'draft', draft: true, publishDate: new Date('2026-01-01') },
      { slug: 'undated', draft: false }
    ]

    expect(findUnpublished(posts, ['https://santi020k.com/blog/live/'], now)).toEqual(['https://santi020k.com/blog/due/'])
    expect(findUnpublished(posts, ['https://santi020k.com/blog/live/', 'https://santi020k.com/blog/due/'], now)).toEqual([])
  })

  test('reads every authored post once, without its translations', async () => {
    const posts = await readPosts()
    const slugs = posts.map(({ slug }) => slug)

    expect(posts.length).toBeGreaterThan(50)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(posts.every(({ publishDate }) => publishDate instanceof Date)).toBe(true)
  })
})
