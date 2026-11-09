import type { CollectionEntry } from 'astro:content'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { postTranslationSchema, projectTranslationSchema } from '../../content-translations'

type TranslationCollection = 'postTranslation' | 'projectTranslation'

const { getCollectionMock, getEntryMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn<(collection: TranslationCollection) => Promise<CollectionEntry<TranslationCollection>[]>>(),
  getEntryMock: vi.fn<(collection: 'project', id: string) => Promise<CollectionEntry<'project'> | undefined>>()
}))

vi.mock('astro:content', () => ({ getCollection: getCollectionMock, getEntry: getEntryMock }))

const { mergePostTranslation, mergeProjectTranslation } = await import('../content-translations')

const post: CollectionEntry<'post'> = {
  collection: 'post',
  id: '2026/example',
  body: 'English body',
  data: {
    contentLocale: 'en',
    title: 'Example',
    description: 'Original description',
    draft: true,
    publishDate: new Date('2027-02-01T00:00:00Z'),
    updatedDate: undefined,
    tags: ['typescript'],
    postType: 'Article',
    canonicalUrl: 'https://example.com/original/',
    startHere: { order: 1, label: 'Start', reason: 'Learn the system' }
  }
}

const translation: CollectionEntry<'postTranslation'> = {
  collection: 'postTranslation',
  id: post.id,
  body: 'Cuerpo en español',
  data: { title: 'Ejemplo', description: 'Descripción traducida', startHere: { label: 'Empieza', reason: 'Conoce el sistema' } }
}

const project: CollectionEntry<'project'> = {
  collection: 'project',
  id: 'example',
  body: 'Original',
  data: {
    contentLocale: 'en',
    title: 'Project',
    description: 'Description',
    brand: { primary: '#000000', secondary: '#111111', surface: '#ffffff' },
    draft: false,
    technologies: ['Astro'],
    startingDate: new Date('2026-01-01'),
    endingDate: undefined,
    updatedDate: undefined,
    impactMetrics: ['An outcome'],
    focusAreas: [{ label: 'One', description: 'First' }, { label: 'Two', description: 'Second' }],
    relevanceWeight: 1,
    closingLinks: [{ label: 'Read docs', href: 'https://example.com/docs/' }]
  }
}
const translated: CollectionEntry<'projectTranslation'> = {
  collection: 'projectTranslation',
  id: project.id,
  body: 'Traducción',
  data: { title: 'Proyecto',
    description: 'Descripción',
    impactMetrics: ['Un resultado'],
    focusAreas: [{ label: 'Uno', description: 'Primero' }, { label: 'Dos', description: 'Segundo' }],
    closingLinkLabels: ['Leer documentación'] }
}

describe('translated content ownership', () => {
  test('replaces copy while preserving publication, identity and provenance', () => {
    const localized = mergePostTranslation(post, translation)

    expect(localized.id).toBe(post.id)
    expect(localized.collection).toBe('post')
    expect(localized.body).toBe('Cuerpo en español')
    expect(localized.data).toMatchObject({
      title: 'Ejemplo',
      contentLocale: 'es',
      draft: true,
      publishDate: post.data.publishDate,
      canonicalUrl: post.data.canonicalUrl,
      tags: ['typescript'],
      startHere: { order: 1, label: 'Empieza' }
    })
    expect(post.body).toBe('English body')
    expect(post.data.title).toBe('Example')
  })

  test('translation schemas cannot change publication or project URLs', () => {
    expect(postTranslationSchema.safeParse({ ...translation.data, draft: false }).success).toBe(false)
    expect(postTranslationSchema.safeParse({ ...translation.data, publishDate: '2026-01-01' }).success).toBe(false)
    expect(projectTranslationSchema.safeParse({ title: 'Proyecto', description: 'Descripción', liveDemoUrl: 'https://example.com/' }).success).toBe(false)
  })

  test('keeps project destinations and assets while translating their labels', () => {
    expect(mergeProjectTranslation(project, translated).data.closingLinks)
      .toEqual([{ label: 'Leer documentación', href: 'https://example.com/docs/' }])
    const missingLabels = { ...translated, data: { ...translated.data, closingLinkLabels: [] } }

    expect(() => mergeProjectTranslation(project, missingLabels))
      .toThrow('item count')
  })
})

describe('localized content lookup', () => {
  beforeEach(() => {
    vi.resetModules()
    getCollectionMock.mockReset()
    getEntryMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('keeps the source post for English and when Spanish copy is missing', async () => {
    const { localizePost } = await import('../content-translations')

    expect(await localizePost(post, 'en')).toBe(post)
    expect(getCollectionMock).not.toHaveBeenCalled()

    getCollectionMock.mockResolvedValueOnce([])

    expect(await localizePost(post, 'es')).toBe(post)
    expect(getCollectionMock).toHaveBeenCalledWith('postTranslation')
  })

  test('looks up a translated project by its original ID and preserves its destination', async () => {
    getEntryMock.mockResolvedValueOnce(project).mockResolvedValueOnce(undefined)
    getCollectionMock.mockResolvedValueOnce([{ ...translated, id: 'unrelated' }, translated])

    const { getLocalizedProject } = await import('../content-translations')

    const localized = await getLocalizedProject(project.id, 'es')

    expect(localized).toMatchObject({
      id: project.id,
      body: translated.body,
      data: {
        contentLocale: 'es',
        title: translated.data.title,
        closingLinks: [{ label: 'Leer documentación', href: 'https://example.com/docs/' }]
      }
    })
    expect(await getLocalizedProject('missing', 'es')).toBeUndefined()
    expect(getEntryMock).toHaveBeenNthCalledWith(1, 'project', project.id)
    expect(getEntryMock).toHaveBeenNthCalledWith(2, 'project', 'missing')
    expect(getCollectionMock).toHaveBeenCalledExactlyOnceWith('projectTranslation')
  })

  test('shares a production lookup and retries after a collection failure', async () => {
    vi.stubEnv('PROD', true)
    const error = new Error('Could not load translations')

    getCollectionMock.mockRejectedValueOnce(error).mockResolvedValueOnce([translation])

    const { localizePost } = await import('../content-translations')

    const first = localizePost(post, 'es')
    const second = localizePost(post, 'es')

    await Promise.all([expect(first).rejects.toBe(error), expect(second).rejects.toBe(error)])
    expect(getCollectionMock).toHaveBeenCalledTimes(1)

    expect(await localizePost(post, 'es')).toMatchObject({
      body: translation.body,
      data: { contentLocale: 'es', title: translation.data.title }
    })
    expect(await localizePost({ ...post, id: 'missing' }, 'es')).toMatchObject({
      body: post.body,
      data: { contentLocale: 'en', title: post.data.title }
    })
    expect(getCollectionMock).toHaveBeenCalledTimes(2)
  })
})
