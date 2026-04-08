import { describe, expect, it } from 'vitest'

import { getAdjacentSeriesPosts, sortSeriesPosts } from '../series'

const buildPost = (id: string, publishDate: string, seriesOrder?: number) => ({
  data: {
    publishDate: new Date(publishDate),
    seriesOrder
  },
  id
})

describe('sortSeriesPosts', () => {
  it('sorts by explicit series order before publish date', () => {
    const posts = [
      buildPost('third', '2024-03-03', 3),
      buildPost('first', '2024-03-01', 1),
      buildPost('second', '2024-03-02', 2)
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['first', 'second', 'third'])
  })

  it('falls back to publish date when no order is present', () => {
    const posts = [
      buildPost('later', '2024-04-18'),
      buildPost('earlier', '2024-03-21')
    ]

    expect(sortSeriesPosts(posts).map(post => post.id)).toEqual(['earlier', 'later'])
  })
})

describe('getAdjacentSeriesPosts', () => {
  it('returns previous and next posts around the current post', () => {
    const posts = [
      buildPost('first', '2024-03-01', 1),
      buildPost('second', '2024-03-02', 2),
      buildPost('third', '2024-03-03', 3)
    ]

    expect(getAdjacentSeriesPosts(posts, 'second')).toEqual({
      currentIndex: 1,
      next: posts[2],
      previous: posts[0]
    })
  })
})
