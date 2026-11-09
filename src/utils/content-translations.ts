import type { CollectionEntry } from 'astro:content'
import { getCollection, getEntry } from 'astro:content'

import type { Locale } from '@/i18n'

type Post = CollectionEntry<'post'>

type Project = CollectionEntry<'project'>

type PostTranslation = CollectionEntry<'postTranslation'>

type ProjectTranslation = CollectionEntry<'projectTranslation'>

const translationMap = <Entry extends { id: string }>(load: () => Promise<Entry[]>) => {
  let pending: Promise<Map<string, Entry>> | undefined

  return async () => {
    const read = async () => new Map((await load()).map(entry => [entry.id, entry]))

    if (!import.meta.env.PROD) return read()

    pending ??= read().catch((error: unknown) => {
      pending = undefined

      throw error
    })

    return pending
  }
}

const posts = translationMap(() => getCollection('postTranslation'))
const projects = translationMap(() => getCollection('projectTranslation'))

export const getPostTranslation = async (id: string) => (await posts()).get(id)
export const getProjectTranslation = async (id: string) => (await projects()).get(id)

/** Preserve publication state and identity while replacing only authored copy. */
export const mergePostTranslation = (post: Post, translation: PostTranslation): Post => {
  const { coverImage, startHere, ...copy } = translation.data

  return {
    ...post,
    body: translation.body ?? '',
    data: {
      ...post.data,
      ...copy,
      contentLocale: 'es',
      ...(post.data.coverImage && coverImage ? { coverImage: { ...post.data.coverImage, ...coverImage } } : {}),
      ...(post.data.startHere && startHere ? { startHere: { ...post.data.startHere, ...startHere } } : {})
    }
  }
}

const translatedItems = <Original, Translation, Result>(
  original: readonly Original[],
  translated: readonly Translation[],
  merge: (original: Original, translation: Translation) => Result,
  field: string
): Result[] => {
  if (original.length !== translated.length) throw new Error(`Translation must preserve ${field} item count.`)

  return original.map((item, index) => {
    const translation = translated[index]

    if (translation === undefined) throw new Error(`Missing ${field} translation at ${index}.`)

    return merge(item, translation)
  })
}

export const mergeProjectTranslation = (project: Project, translation: ProjectTranslation): Project => {
  const { closingLinkLabels, coverImage, previews, relatedWritingLabels, ...copy } = translation.data

  return {
    ...project,
    body: translation.body ?? '',
    data: {
      ...project.data,
      ...copy,
      contentLocale: 'es',
      ...(project.data.coverImage && coverImage ? { coverImage: { ...project.data.coverImage, ...coverImage } } : {}),
      ...(closingLinkLabels ?
        {
          closingLinks: translatedItems(project.data.closingLinks ?? [], closingLinkLabels, (link, label) => ({ ...link, label }), `${project.id} closingLinks`)
        } :
        {}),
      ...(relatedWritingLabels ?
        {
          relatedWriting: translatedItems(project.data.relatedWriting ?? [], relatedWritingLabels, (selection, label) => ({ ...selection, label }), `${project.id} relatedWriting`)
        } :
        {}),
      ...(project.data.previews && previews ?
        {
          previews: {
            ...project.data.previews,
            ...previews,
            images: translatedItems(project.data.previews.images, previews.images, (image, copy) => ({ ...image, ...copy }), `${project.id} previews`)
          }
        } :
        {})
    }
  }
}

export const localizePost = async (post: Post, locale: Locale): Promise<Post> => {
  if (locale === 'en') return post

  const translation = await getPostTranslation(post.id)

  return translation ? mergePostTranslation(post, translation) : post
}

export const localizeProject = async (project: Project, locale: Locale): Promise<Project> => {
  if (locale === 'en') return project

  const translation = await getProjectTranslation(project.id)

  return translation ? mergeProjectTranslation(project, translation) : project
}

export const getLocalizedProject = async (id: string, locale: Locale) => {
  const project = await getEntry('project', id)

  return project ? localizeProject(project, locale) : undefined
}
