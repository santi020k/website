import { expect, test } from 'vitest'

import { getStartHerePosts } from '../start-here'

const now = new Date('2026-10-20T12:00:00Z')
const entry = (id: string, order?: number, draft = false, publishDate = new Date('2026-01-01')) => ({
  id,
  data: { draft, publishDate, ...(order ? { startHere: { order } } : {}) }
})

test('curates by editorial order without changing the recent-post input', () => {
  const posts = [entry('third', 3), entry('first', 1), entry('second', 2), entry('fourth', 4)]
  expect(getStartHerePosts(posts, now).map(post => post.id)).toEqual(['first', 'second', 'third'])
  expect(posts.map(post => post.id)).toEqual(['third', 'first', 'second', 'fourth'])
})

test('never promotes drafts, scheduled posts, or unselected articles', () => {
  const posts = [
    entry('draft', 1, true),
    entry('future', 2, false, new Date('2026-10-21')),
    entry('ordinary'),
    entry('published-now', 3, false, now)
  ]
  expect(getStartHerePosts(posts, now).map(post => post.id)).toEqual(['published-now'])
  expect(getStartHerePosts([], now)).toEqual([])
})

test('resolves tied editorial positions consistently', () => {
  expect(getStartHerePosts([entry('b', 1), entry('a', 1)], now).map(post => post.id)).toEqual(['a', 'b'])
})
