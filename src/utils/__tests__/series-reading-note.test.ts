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

const getSchema = () => {
  const schema = collections.series.schema

  if (!schema || typeof schema === 'function') throw new Error('Expected the series schema')

  return schema
}
const entry = { title: 'Series', description: 'A reading path.', cadence: 'Read at your own pace.' }

test('keeps existing series valid without a reading note', () => {
  expect(getSchema().safeParse(entry).success).toBe(true)
})

test.each(['audience', 'perspective'])('accepts an authored %s note', kind => {
  expect(getSchema().parse({ ...entry, readingNote: { kind, text: '  A useful reading perspective.  ' } }))
    .toMatchObject({ readingNote: { kind, text: 'A useful reading perspective.' } })
})

test.each([
  { kind: 'audience', text: '   ' },
  { kind: 'unknown', text: 'A reading note.' },
  { text: 'A reading note.' },
  { kind: 'perspective' }
])('rejects incomplete or unsupported reading notes: %j', readingNote => {
  expect(getSchema().safeParse({ ...entry, readingNote }).success).toBe(false)
})
