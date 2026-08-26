import { getImage } from 'astro:assets'

import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getPostPath } from '@/utils/links'
import { getProjectCoverForUsage } from '@/utils/project-cover'

import type { APIRoute, ImageMetadata } from 'astro'

interface SearchIndexEntry {
  coverAlt?: string
  coverAvifUrl?: string
  coverHeight?: number
  coverUrl?: string
  coverWidth?: number
  description: string
  path: string
  searchCategory: 'tag' | 'technology'
  tags: string[]
  title: string
  type: 'community' | 'post' | 'project'
}

type SearchThumbFields = Partial<Pick<SearchIndexEntry, 'coverAlt' | 'coverAvifUrl' | 'coverHeight' | 'coverUrl' | 'coverWidth'>>

const searchThumb = async (
  cover: { alt: string, src: ImageMetadata } | undefined
): Promise<SearchThumbFields> => {
  if (!cover) return {}

  const [webp, avif] = await Promise.all([
    getImage({ format: 'webp', src: cover.src, width: 200 }),
    getImage({ format: 'avif', src: cover.src, width: 200 })
  ])

  const { attributes } = webp
  const width = typeof attributes.width === 'number' ? attributes.width : undefined
  const height = typeof attributes.height === 'number' ? attributes.height : undefined

  const out: SearchThumbFields = {
    coverAlt: cover.alt,
    coverAvifUrl: avif.src,
    coverUrl: webp.src
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
      searchCategory: 'tag',
      tags: post.data.tags,
      title: post.data.title,
      type: 'post',
      ...(await searchThumb(post.data.coverImage))
    }))
  )

  const projectEntries = await Promise.all(
    projects.map(async (project): Promise<SearchIndexEntry> => {
      const thumbnail = getProjectCoverForUsage(project.data.coverImage, 'thumbnail')

      const searchCover = project.data.coverImage && thumbnail ?
        { alt: project.data.coverImage.alt, src: thumbnail } :
        undefined

      return {
        description: project.data.description,
        path: getPortfolioPath(project.id),
        searchCategory: 'technology',
        tags: project.data.technologies,
        title: project.data.title,
        type: project.data.typesId === 'community' ? 'community' : 'project',
        ...(await searchThumb(searchCover))
      }
    })
  )

  const entries = [...postEntries, ...projectEntries]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
