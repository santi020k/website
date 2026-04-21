import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getPostPath } from '@/utils/links'

import type { APIRoute, ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'

interface SearchIndexEntry {
  coverAlt?: string
  coverHeight?: number
  coverUrl?: string
  coverWidth?: number
  description: string
  path: string
  tags: string[]
  title: string
  type: 'post' | 'project'
}

type SearchThumbFields = Partial<Pick<SearchIndexEntry, 'coverAlt' | 'coverHeight' | 'coverUrl' | 'coverWidth'>>

const searchThumb = async (
  cover: { alt: string, src: ImageMetadata } | undefined
): Promise<SearchThumbFields> => {
  if (!cover) return {}

  const optimized = await getImage({
    format: 'webp',
    src: cover.src,
    width: 200
  })

  const { attributes } = optimized
  const width = typeof attributes.width === 'number' ? attributes.width : undefined
  const height = typeof attributes.height === 'number' ? attributes.height : undefined

  const out: SearchThumbFields = {
    coverAlt: cover.alt,
    coverUrl: optimized.src
  }

  if (typeof width === 'number') out.coverWidth = width

  if (typeof height === 'number') out.coverHeight = height

  return out
}

export const GET: APIRoute = async () => {
  const [posts, projects] = await Promise.all([getCachedPosts(), getCachedProjects()])

  const postEntries = await Promise.all(
    posts.map(async (post): Promise<SearchIndexEntry> => ({
      description: post.data.description,
      path: getPostPath(post.id),
      tags: post.data.tags,
      title: post.data.title,
      type: 'post',
      ...(await searchThumb(post.data.coverImage))
    }))
  )

  const projectEntries = await Promise.all(
    projects.map(async (project): Promise<SearchIndexEntry> => ({
      description: project.data.description,
      path: getPortfolioPath(project.id),
      tags: project.data.technologies,
      title: project.data.title,
      type: 'project',
      ...(await searchThumb(project.data.coverImage))
    }))
  )

  const entries = [...postEntries, ...projectEntries]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
