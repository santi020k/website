import { z } from 'astro/zod'
import { expect, test, vi } from 'vitest'

import { collections } from '../../content.config'
import { getPublicationImprint } from '../article-publication'

vi.mock('astro:content', () => ({
  defineCollection: <T>(collection: T): T => collection,
  reference: (collection: string) => z.union([
    z.string().transform(id => ({ collection, id })),
    z.object({ collection: z.literal(collection), id: z.string() })
  ])
}))

const publication = { name: 'Towards Dev', url: 'https://towardsdev.com', platform: 'Medium' }
const post = { title: 'Example article', canonicalUrl: 'https://towardsdev.com/example', originalPublication: publication }
const getSchema = () => {
  const schema = collections.post.schema

  if (typeof schema !== 'function') throw new Error('Expected the post schema factory')

  return schema({
    image: () => z.object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      format: z.union([
        z.literal('png'),
        z.literal('jpg'),
        z.literal('jpeg'),
        z.literal('tiff'),
        z.literal('webp'),
        z.literal('gif'),
        z.literal('svg'),
        z.literal('avif'),
        z.literal('apng')
      ])
    })
  })
}
const content = { ...post, description: 'Publication fixture.', publishDate: '2024-01-01' }

test('appends publication references without changing prose numbering or the caller array', () => {
  const prose = [{ href: 'https://example.com/guide', label: 'Guide' }]
  const result = getPublicationImprint(post, prose)

  expect(result.imprint).toEqual({
    ...publication, originalUrl: post.canonicalUrl, publisherReference: 2, articleReference: 3
  })
  expect(result.references).toEqual([
    ...prose,
    { href: 'https://towardsdev.com/', label: 'Towards Dev' },
    { href: post.canonicalUrl, label: post.title }
  ])
  expect(prose).toEqual([{ href: 'https://example.com/guide', label: 'Guide' }])
})

test('reuses existing normalized source references and their prose labels', () => {
  const prose = [
    { href: post.canonicalUrl, label: 'Earlier source link' },
    { href: 'https://towardsdev.com/', label: 'Publisher in the prose' }
  ]
  const result = getPublicationImprint(post, prose)

  expect(result.imprint).toMatchObject({ publisherReference: 2, articleReference: 1 })
  expect(result.references).toEqual(prose)
})

test('a publisher and article sharing one URL receive one print reference', () => {
  const result = getPublicationImprint({ ...post, canonicalUrl: publication.url }, [])

  expect(result.imprint).toMatchObject({ publisherReference: 1, articleReference: 1 })
  expect(result.references).toHaveLength(1)
})

test.each([
  { title: 'Original post' },
  { title: 'Syndicated post without a publisher credit', canonicalUrl: post.canonicalUrl },
  { title: 'Incomplete metadata', originalPublication: publication }
])('does not invent a publication credit for $title', data => {
  const prose = [{ href: 'https://example.com/', label: 'Reference' }]

  expect(getPublicationImprint(data, prose)).toEqual({ imprint: undefined, references: prose })
})

test('valid publication metadata is optional and preserves the canonical source URL', () => {
  expect(getSchema().parse(content)).toMatchObject(post)
  expect(getSchema().safeParse({ ...content, originalPublication: undefined }).success).toBe(true)
})

test.each([undefined, 'mailto:author@example.com', 'javascript:alert(1)'])('publication metadata requires an HTTP(S) article URL: %s', canonicalUrl => {
  const parsed = getSchema().safeParse({ ...content, canonicalUrl })

  expect(parsed.success).toBe(false)
  expect(parsed.error?.issues.map(issue => issue.path.join('.'))).toContain('canonicalUrl')
})

test.each([
  { ...publication, name: ' ' },
  { ...publication, platform: ' ' },
  { ...publication, url: 'javascript:alert(1)' },
  { ...publication, url: 'mailto:author@example.com' }
])('rejects incomplete or non-web publisher metadata: %j', originalPublication => {
  expect(getSchema().safeParse({ ...content, originalPublication }).success).toBe(false)
})
