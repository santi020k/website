import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

interface MockPost {
  id: string
  data: { publishDate: Date, draft: boolean }
}

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn<() => Promise<MockPost[]>>()
}))

vi.mock('astro:content', () => ({ getCollection: getCollectionMock }))

const selection = (id: string, label = 'Project story') => ({ post: { collection: 'post' as const, id }, label })
const post = (id: string, publishDate = '2026-01-01', draft = false): MockPost => ({
  id, data: { publishDate: new Date(publishDate), draft }
})

describe('curated project writing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('PROD', false)
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'))
    getCollectionMock.mockReset().mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  test('omits drafts, future posts, missing references and duplicate selections even in development', async () => {
    getCollectionMock.mockResolvedValue([post('live'), post('draft', '2026-01-01', true), post('future', '2027-01-01')])
    const { getProjectWriting } = await import('../content')
    const result = await getProjectWriting([
      selection('draft'), selection('future'), selection('missing'), selection('live'), selection('live')
    ])

    expect(result.map(story => story.post.id)).toEqual(['live'])
  })

  test('preserves editorial order and labels rather than sorting the pair by publication date', async () => {
    getCollectionMock.mockResolvedValue([post('newer', '2026-10-25'), post('older')])
    const { getProjectWriting } = await import('../content')
    const result = await getProjectWriting([selection('older', 'System design'), selection('newer', 'Launch note')])

    expect(result.map(story => [story.post.id, story.label])).toEqual([
      ['older', 'System design'], ['newer', 'Launch note']
    ])
  })

  test('does not load posts for a project without curated writing', async () => {
    const { getProjectWriting } = await import('../content')

    expect(await getProjectWriting()).toEqual([])
    expect(getCollectionMock).not.toHaveBeenCalled()
  })
})
