import path from 'node:path'

import { type ContentFile, readContentFiles } from '../../scripts/js/utils/frontmatter.mjs'
import { parseContentDate } from '../utils/content-date'
import { getPostSlug } from '../utils/posts'

type FrontmatterDateKey = 'publishDate' | 'updatedDate'

export interface ContentSitemapMetadata {
  /** Latest content change per page URL, as ISO strings. */
  lastmodMap: Map<string, string>
  /** Pages whose frontmatter names another canonical URL; they stay out of the sitemap. */
  nonCanonicalPageUrls: Set<string>
}

/** Matches the content schema so sitemap dates and scheduling agree in every build timezone. */
const toIso = (value: unknown): string | undefined => {
  if (!(value instanceof Date) && typeof value !== 'string') return undefined

  const date = parseContentDate(value)

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const firstDate = (file: ContentFile, prefer: readonly FrontmatterDateKey[]) => {
  for (const key of prefer) {
    const iso = toIso(file.frontmatter[key])

    if (iso) return iso
  }

  return undefined
}

const trimmedString = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * Builds sitemap metadata for content-collection routes from frontmatter.
 * Last-modified dates let entries advertise real content changes, while pages
 * that declare another canonical URL are omitted to avoid conflicting signals.
 */
export const buildContentSitemapMetadata = async (
  { now = new Date(), root = process.cwd(), siteOrigin }: { now?: Date, root?: string, siteOrigin: string }
): Promise<ContentSitemapMetadata> => {
  const lastmodMap = new Map<string, string>()
  const nonCanonicalPageUrls = new Set<string>()

  const updateLatest = (url: string, iso: string | undefined) => {
    if (!iso) return

    const existing = lastmodMap.get(url)

    if (!existing || iso > existing) lastmodMap.set(url, iso)
  }

  const register = (url: string, iso: string | undefined) => {
    if (iso) lastmodMap.set(url, iso)

    return iso
  }

  // Posts: src/content/post/**/<slug>(/index)?.md(x) -> /blog/<slug>/
  for (const post of await readContentFiles(path.resolve(root, 'src/content/post'))) {
    const { frontmatter } = post

    if (frontmatter.draft === true) continue

    const publishDate = toIso(frontmatter.publishDate)

    if (publishDate && new Date(publishDate) > now) continue

    const pageUrl = `${siteOrigin}/blog/${getPostSlug(post.id)}/`
    const canonicalUrl = frontmatter.canonicalUrl

    if (typeof canonicalUrl === 'string' && canonicalUrl !== pageUrl) nonCanonicalPageUrls.add(pageUrl)

    const postLastmod = register(pageUrl, firstDate(post, ['updatedDate', 'publishDate']))

    updateLatest(`${siteOrigin}/blog/`, postLastmod)

    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : []

    for (const tag of tags.map(trimmedString)) {
      if (!tag) continue

      updateLatest(`${siteOrigin}/blog/tags/`, postLastmod)

      updateLatest(`${siteOrigin}/blog/tags/${encodeURIComponent(tag.toLowerCase())}/`, postLastmod)
    }

    const seriesId = trimmedString(frontmatter.seriesId)

    if (seriesId) {
      updateLatest(`${siteOrigin}/blog/series/`, postLastmod)

      updateLatest(`${siteOrigin}/blog/series/${seriesId}/`, postLastmod)
    }
  }

  // Projects: src/content/project/<slug>(/index)?.md(x) -> /portfolio/<slug>/
  for (const project of await readContentFiles(path.resolve(root, 'src/content/project'))) {
    if (project.frontmatter.draft === true) continue

    const slug = project.id.split('/').pop() ?? project.id
    // Project start/end dates describe the work, not this case study's latest edit.
    const projectLastmod = register(`${siteOrigin}/portfolio/${slug}/`, firstDate(project, ['updatedDate']))

    updateLatest(`${siteOrigin}/projects/`, projectLastmod)
  }

  return { lastmodMap, nonCanonicalPageUrls }
}
