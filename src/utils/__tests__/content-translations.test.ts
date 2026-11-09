import type { CollectionEntry } from 'astro:content'

import { describe, expect, test, vi } from 'vitest'

import { postTranslationSchema, projectTranslationSchema } from '../../content-translations'

vi.mock('astro:content', () => ({ getCollection: vi.fn(), getEntry: vi.fn() }))

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

    expect(mergeProjectTranslation(project, translated).data.closingLinks)
      .toEqual([{ label: 'Leer documentación', href: 'https://example.com/docs/' }])
    const missingLabels = { ...translated, data: { ...translated.data, closingLinkLabels: [] } }

    expect(() => mergeProjectTranslation(project, missingLabels))
      .toThrow('item count')
  })
})
