import type { CollectionEntry } from 'astro:content'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { posts, postTranslations, series } = vi.hoisted(() => ({
  posts: [] as CollectionEntry<'post'>[],
  postTranslations: [] as CollectionEntry<'postTranslation'>[],
  series: [] as CollectionEntry<'series'>[]
}))

vi.mock('astro:content', () => ({
  getCollection: (
    collection: 'post' | 'postTranslation' | 'series',
    filter?: (entry: CollectionEntry<'post' | 'postTranslation' | 'series'>) => unknown
  ) => {
    const entries = { post: posts, postTranslation: postTranslations, series }[collection]

    return Promise.resolve(entries.filter(entry => !filter || filter(entry)))
  }
}))

const makeSeries = (id: string, draft = false): CollectionEntry<'series'> => ({
  collection: 'series',
  id,
  data: {
    title: id,
    description: 'A reading track.',
    cadence: 'Monthly',
    focusAreas: [],
    order: 0,
    status: 'active',
    draft
  }
})

const makePost = (id: string, seriesId: string, overrides: Partial<CollectionEntry<'post'>['data']> = {}): CollectionEntry<'post'> => ({
  collection: 'post',
  id,
  data: {
    contentLocale: 'en',
    title: id,
    description: 'A series article.',
    publishDate: new Date('2026-01-01T00:00:00Z'),
    updatedDate: undefined,
    draft: false,
    tags: [],
    postType: 'Article',
    seriesId,
    ...overrides
  }
})

describe('series publication and navigation', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('PROD', true)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-16T00:00:00Z'))
    posts.length = 0
    postTranslations.length = 0
    series.length = 0
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  test('omits draft and empty series from production routes and summaries', async () => {
    series.push(makeSeries('public'), makeSeries('draft', true), makeSeries('empty'), makeSeries('future'))
    posts.push(
      makePost('published', 'public'),
      makePost('public-in-draft-series', 'draft'),
      makePost('draft-post', 'empty', { draft: true }),
      makePost('scheduled', 'future', { publishDate: new Date('2027-01-01T00:00:00Z') })
    )
    const { getSeriesSummaries } = await import('../series')

    expect((await getSeriesSummaries()).map(summary => ({ id: summary.series.id, count: summary.postCount })))
      .toEqual([{ id: 'public', count: 1 }])
  })

  test('does not leak draft series through a published post or link to unpublished posts', async () => {
    const first = makePost('first', 'public', { seriesOrder: 1 })
    const last = makePost('last', 'public', { seriesOrder: 4 })
    const draft = makePost('draft', 'public', { seriesOrder: 2, draft: true })
    const scheduled = makePost('future', 'public', { seriesOrder: 3, publishDate: new Date('2027-01-01T00:00:00Z') })
    const hiddenSeriesPost = makePost('hidden-series-post', 'hidden')
    series.push(makeSeries('public'), makeSeries('hidden', true))
    posts.push(first, draft, scheduled, last, hiddenSeriesPost)
    const { getSeriesContext } = await import('../series')

    expect(await getSeriesContext(first)).toMatchObject({ position: 1, next: last, total: 2 })
    expect(await getSeriesContext(last)).toMatchObject({ position: 2, previous: first, total: 2 })
    expect(await getSeriesContext(hiddenSeriesPost)).toBeNull()
    expect(await getSeriesContext(draft)).toBeNull()
    expect(await getSeriesContext(makePost('missing', 'missing-series'))).toBeNull()
  })

  test('starts chooser cards with the first published chapter in reading order, not the newest post', async () => {
    series.push(makeSeries('public'))
    posts.push(
      makePost('newest', 'public', { seriesOrder: 3, publishDate: new Date('2026-10-01') }),
      makePost('draft', 'public', { seriesOrder: 0, draft: true }),
      makePost('future', 'public', { seriesOrder: 0, publishDate: new Date('2027-01-01') }),
      makePost('first', 'public', { seriesOrder: 1 }),
      makePost('second', 'public', { seriesOrder: 2 })
    )
    const { getSeriesSummaries } = await import('../series')
    const summaries = await getSeriesSummaries()

    expect(summaries[0]?.postCount).toBe(3)
    expect(summaries[0]?.posts.map(post => post.id)).toEqual(['first', 'second', 'newest'])
  })

  test('keeps drafts and empty series available for development previews', async () => {
    vi.stubEnv('PROD', false)
    const draft = makePost('draft-post', 'draft', { draft: true })
    series.push(makeSeries('draft', true), makeSeries('empty'))
    posts.push(draft)
    const { getSeriesContext, getSeriesSummaries } = await import('../series')

    expect((await getSeriesSummaries()).map(summary => ({ id: summary.series.id, minutes: summary.readingMinutes })))
      .toEqual([{ id: 'draft', minutes: 1 }, { id: 'empty', minutes: 0 }])
    expect(await getSeriesContext(draft)).toMatchObject({ position: 1, total: 1, series: { id: 'draft' } })
  })

  test('sums rounded chapter durations and excludes unpublished or unrelated articles', async () => {
    series.push(makeSeries('public'))
    posts.push(
      { ...makePost('first', 'public'), body: 'word '.repeat(201) },
      { ...makePost('second', 'public'), body: 'word '.repeat(201) },
      { ...makePost('draft', 'public', { draft: true }), body: 'word '.repeat(1000) },
      { ...makePost('scheduled', 'public', { publishDate: new Date('2027-01-01') }), body: 'word '.repeat(1000) },
      { ...makePost('unrelated', 'other'), body: 'word '.repeat(1000) }
    )
    const { getSeriesSummaries } = await import('../series')

    expect(await getSeriesSummaries()).toMatchObject([{ postCount: 2, readingMinutes: 4 }])
  })

  test('retains the one-minute chapter minimum for empty or missing bodies', async () => {
    series.push(makeSeries('public'))
    posts.push(makePost('missing', 'public'), { ...makePost('empty', 'public'), body: '' })
    const { getSeriesSummaries } = await import('../series')

    expect(await getSeriesSummaries()).toMatchObject([{ postCount: 2, readingMinutes: 2 }])
  })

  test('uses translated chapter durations when available and keeps the original route entries', async () => {
    const first = { ...makePost('first', 'public', { seriesOrder: 1 }), body: 'word '.repeat(199) }
    const second = { ...makePost('second', 'public', { seriesOrder: 2 }), body: 'word '.repeat(201) }

    series.push(makeSeries('public'))
    posts.push(first, second)
    postTranslations.push({
      collection: 'postTranslation',
      id: first.id,
      body: 'palabra '.repeat(401),
      data: { title: 'Primer capítulo', description: 'Un artículo de la serie.' }
    })

    const { getSeriesSummaries } = await import('../series')

    expect(await getSeriesSummaries()).toMatchObject([{ posts: [first, second], readingMinutes: 3 }])
    expect(await getSeriesSummaries('es')).toMatchObject([{ posts: [first, second], readingMinutes: 5 }])
  })
})
