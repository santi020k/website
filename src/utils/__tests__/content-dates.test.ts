import { z } from 'astro/zod'
import { expect, test, vi } from 'vitest'

import { collections } from '../../content.config'

vi.mock('astro:content', () => ({
  defineCollection: <T>(collection: T): T => collection
}))

// Mirrors the shape of Astro's `image()` helper; these fixtures omit artwork.
const image = () => z.object({
  src: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.union<[
    z.ZodLiteral<'png'>,
    z.ZodLiteral<'jpg'>,
    z.ZodLiteral<'jpeg'>,
    z.ZodLiteral<'tiff'>,
    z.ZodLiteral<'webp'>,
    z.ZodLiteral<'gif'>,
    z.ZodLiteral<'svg'>,
    z.ZodLiteral<'avif'>,
    z.ZodLiteral<'apng'>
  ]>([
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

const getTalkSchema = () => {
  const schema = collections.talk.schema

  if (!schema || typeof schema === 'function') throw new Error('Expected the talk schema')

  return schema
}

const getPostSchema = () => {
  const schema = collections.post.schema

  if (typeof schema !== 'function') throw new Error('Expected the post schema factory')

  return schema({ image })
}

const talk = (date: unknown) => ({
  title: 'Example talk',
  description: 'A content date fixture.',
  event: 'Community meetup',
  year: 2026,
  date
})

const post = (publishDate: unknown, updatedDate?: unknown) => ({
  title: 'Example post',
  description: 'A content date fixture.',
  publishDate,
  ...(updatedDate === undefined ? {} : { updatedDate })
})

test.each([
  { input: new Date('2026-01-15'), expected: new Date('2026-01-15') },
  { input: '2026-01-15', expected: new Date('2026-01-15') },
  { input: '', expected: undefined },
  { input: undefined, expected: undefined }
])('accepts an optional date provided by a content loader: $input', ({ input, expected }) => {
  const parsed: unknown = getTalkSchema().parse(talk(input))

  expect(parsed).toEqual(expect.objectContaining({ date: expected }))
})

test.each([
  { input: new Date('2026-01-15T12:00:00Z'), expected: new Date('2026-01-15T12:00:00Z') },
  { input: '2026-01-15', expected: new Date('2026-01-15') },
  { input: '2026-01-15T12:00:00Z', expected: new Date('2026-01-15T12:00:00Z') }
])('accepts a required date provided by a content loader: $input', ({ input, expected }) => {
  const parsed: unknown = getPostSchema().parse(post(input))

  expect(parsed).toEqual(expect.objectContaining({ publishDate: expected }))
})

test.each(['not a date', '2026-13-45', '2026-02-30T25:00:00Z'])(
  'rejects the invalid date string %s at field validation', input => {
    const required = getPostSchema().safeParse(post(input))
    const optional = getPostSchema().safeParse(post('2026-01-15', input))
    const talkDate = getTalkSchema().safeParse(talk(input))

    for (const [result, field] of [[required, 'publishDate'], [optional, 'updatedDate'], [talkDate, 'date']] as const) {
      expect(result.success).toBe(false)
      expect(result.error?.issues.map(issue => issue.path.join('.'))).toEqual([field])
    }
  }
)
