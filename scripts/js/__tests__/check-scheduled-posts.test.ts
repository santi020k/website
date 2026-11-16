// @vitest-environment node
import { describe, expect, test } from 'vitest'

import { classifyDuePosts, findUnpublished, readPosts, readPublication } from '../check-scheduled-posts.mjs'

const post = (frontmatter: string) => `---\ntitle: "Post"\n${frontmatter}\n---\n\nBody with draft: true and publishDate: "1999-01-01" in prose.\n`

describe('scheduled publication check', () => {
  test('reads the publication date and draft flag from frontmatter only', () => {
    expect(readPublication(post('publishDate: "2027-01-05T14:00:00.000Z"\ndraft: true'))).toEqual({
      draft: true,
      placeholderCover: false,
      publishDate: new Date('2027-01-05T14:00:00.000Z')
    })
    expect(readPublication(post('publishDate: 2026-10-06'))).toEqual({ draft: false, placeholderCover: false, publishDate: new Date('2026-10-06') })
    expect(readPublication(post('publishDate: "soon"')).publishDate).toBeUndefined()
    expect(readPublication('No frontmatter')).toEqual({ draft: false, placeholderCover: false, publishDate: undefined })
  })

  test('respects YAML comments without publishing drafts or dropping scheduled dates', () => {
    const now = new Date('2026-11-16T15:00:00.000Z')
    const draft = readPublication(post('publishDate: "2026-11-16T14:00:00.000Z"\ndraft: true # Waiting for cover approval'))
    const ready = readPublication(post('publishDate: "2026-11-16T14:00:00.000Z" # Publish on Monday\ndraft: false # Reviewed'))

    expect(draft.draft).toBe(true)
    expect(ready.publishDate).toEqual(new Date('2026-11-16T14:00:00.000Z'))
    expect(findUnpublished([{ slug: 'draft', ...draft }, { slug: 'ready', ...ready }], [], now)).toEqual([
      'https://santi020k.com/blog/ready/'
    ])
  })

  test.each([
    ['2026-11-16 # UTC date', '2026-11-16T00:00:00.000Z'],
    ['"16 Nov 2026"', '2026-11-16T00:00:00.000Z'],
    ['"2026-11-16T14:00:00"', '2026-11-16T14:00:00.000Z'],
    ['"2026-11-16T14:00:00-05:00"', '2026-11-16T19:00:00.000Z']
  ])('uses the content date contract for %s', (authoredDate, expected) => {
    expect(readPublication(post(`publishDate: ${authoredDate}`)).publishDate).toEqual(new Date(expected))
  })

  test('ignores unsupported dates and rejects malformed frontmatter', () => {
    for (const value of ['"2026-02-29"', '"11/16/2026"', '123', 'null']) {
      expect(readPublication(post(`publishDate: ${value}`)).publishDate).toBeUndefined()
    }
    expect(() => readPublication(post('draft: [invalid'))).toThrow()
  })

  test('reads CRLF frontmatter and folded placeholder descriptions as YAML', () => {
    const source = post('publishDate: "2026-11-16"\ncoverImage:\n  alt: >-\n    Placeholder cover:\n    a graphite panel').replaceAll('\n', '\r\n')

    expect(readPublication(source)).toEqual({
      draft: false,
      placeholderCover: true,
      publishDate: new Date('2026-11-16T00:00:00.000Z')
    })
    expect(readPublication(post('publishDate: "2026-11-16"\ndescription: |\n  alt: Placeholder cover in prose')).placeholderCover).toBe(false)
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

  test('holds back due posts that still use the placeholder cover', () => {
    const cover = (alt: string) => post(`publishDate: "2026-11-24T15:00:00.000Z"\ncoverImage:\n  alt: "${alt}"\n  src: "./cover.webp"`)

    expect(readPublication(cover('Placeholder cover: a graphite panel')).placeholderCover).toBe(true)
    expect(readPublication(cover('Portada provisional: un panel grafito')).placeholderCover).toBe(true)
    expect(readPublication(cover('Three panels joined by a placeholder path')).placeholderCover).toBe(false)

    const now = new Date('2026-11-24T15:17:00.000Z')

    const posts = [
      { slug: 'ready', draft: false, placeholderCover: false, publishDate: new Date('2026-11-24T15:00:00.000Z') },
      { slug: 'unfinished', draft: false, placeholderCover: true, publishDate: new Date('2026-11-24T15:00:00.000Z') }
    ]

    expect(classifyDuePosts(posts, [], now)).toEqual({
      blocked: ['https://santi020k.com/blog/unfinished/'],
      ready: ['https://santi020k.com/blog/ready/']
    })
    expect(findUnpublished(posts, [], now)).toEqual(['https://santi020k.com/blog/ready/'])
  })

  test('reads every authored post once, without its translations', async () => {
    const posts = await readPosts()
    const slugs = posts.map(({ slug }) => slug)

    expect(posts.length).toBeGreaterThan(50)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(posts.every(({ publishDate }) => publishDate instanceof Date)).toBe(true)
  })
})
