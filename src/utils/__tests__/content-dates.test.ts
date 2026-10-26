import { z } from 'astro/zod'
import { expect, test, vi } from 'vitest'

import { collections } from '../../content.config'

vi.mock('astro:content', () => ({
  defineCollection: <T>(collection: T): T => collection,
  reference: (collection: string) => z.union([
    z.string().transform(id => ({ collection, id })),
    z.object({ collection: z.literal(collection), id: z.string() })
  ])
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

const getProjectSchema = () => {
  const schema = collections.project.schema

  if (typeof schema !== 'function') throw new Error('Expected the project schema factory')

  return schema({ image })
}

const utcDate = (calendarDate: string) => new Date(`${calendarDate}T00:00:00.000Z`)

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

const project = (startingDate: unknown, endingDate?: unknown, updatedDate?: unknown) => ({
  title: 'Example project',
  description: 'A content date fixture.',
  brand: { primary: '#112233', secondary: '#445566', surface: '#778899' },
  focusAreas: [
    { label: 'Architecture', description: 'Shared platform foundations' },
    { label: 'Delivery', description: 'Product implementation and release work' }
  ],
  startingDate,
  ...(endingDate === undefined ? {} : { endingDate }),
  ...(updatedDate === undefined ? {} : { updatedDate })
})

test('parses a legacy D Mon YYYY publish date as a UTC calendar date', () => {
  // Mirrors the published RoadScore post frontmatter.
  const parsed: unknown = getPostSchema().parse(post('4 Sep 2026'))

  expect(parsed).toEqual(expect.objectContaining({ publishDate: utcDate('2026-09-04') }))
})

test('parses legacy D Mon YYYY project start and end dates as UTC calendar dates', () => {
  const parsed: unknown = getProjectSchema().parse(project('1 Jan 2020', '1 Jan 2021'))

  expect(parsed).toEqual(expect.objectContaining({
    startingDate: utcDate('2020-01-01'),
    endingDate: utcDate('2021-01-01')
  }))
})

test.each([
  { name: 'post updatedDate', parse: () => getPostSchema().parse(post('2026-01-15', '20 Oct 2026')), field: 'updatedDate' },
  { name: 'project updatedDate', parse: () => getProjectSchema().parse(project('1 Jan 2020', undefined, '20 Oct 2026')), field: 'updatedDate' },
  { name: 'talk date', parse: () => getTalkSchema().parse(talk('20 Oct 2026')), field: 'date' }
])('parses a legacy D Mon YYYY optional $name as a UTC calendar date', ({ parse, field }) => {
  const parsed: unknown = parse()

  expect(parsed).toEqual(expect.objectContaining({ [field]: utcDate('2026-10-20') }))
})

test.each([
  { input: '2026-09-04T23:30:00-05:00', expected: new Date('2026-09-05T04:30:00.000Z') },
  { input: '2026-09-04T08:00:00+09:00', expected: new Date('2026-09-03T23:00:00.000Z') }
])('preserves the instant of an explicit offset timestamp: $input', ({ input, expected }) => {
  const parsed: unknown = getPostSchema().parse(post(input, input))

  expect(parsed).toEqual(expect.objectContaining({ publishDate: expected, updatedDate: expected }))
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

test.each([
  { input: '2024-02-29', expected: utcDate('2024-02-29') },
  { input: '29 Feb 2000', expected: utcDate('2000-02-29') }
])('accepts the leap day $input', ({ input, expected }) => {
  const parsed: unknown = getPostSchema().parse(post(input, input))

  expect(parsed).toEqual(expect.objectContaining({ publishDate: expected, updatedDate: expected }))
})

test.each(['not a date', '2026-13-45', '2026-02-30T25:00:00Z', '2026-02-29', '29 Feb 1900', '31 Apr 2026', '2026-04-31T12:00:00Z'])(
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
