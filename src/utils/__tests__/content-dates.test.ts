import { expect, test, vi } from 'vitest'

import { collections } from '../../content.config'

vi.mock('astro:content', () => ({
  defineCollection: <T>(collection: T): T => collection
}))

test.each([
  { input: new Date('2026-01-15'), expected: new Date('2026-01-15') },
  { input: '2026-01-15', expected: new Date('2026-01-15') },
  { input: undefined, expected: undefined }
])('accepts an optional date provided by a content loader: $input', ({ input, expected }) => {
  const schema = collections.talk.schema

  if (!schema || typeof schema === 'function') throw new Error('Expected the talk schema')

  const parsed: unknown = schema.parse({
    title: 'Example talk',
    description: 'A content date fixture.',
    event: 'Community meetup',
    year: 2026,
    date: input
  })

  expect(parsed).toEqual(expect.objectContaining({ date: expected }))
})
