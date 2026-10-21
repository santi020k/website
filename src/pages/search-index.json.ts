import { getImage } from 'astro:assets'

import type { SearchIndexEntry } from '@/types/search'
import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getPostPath } from '@/utils/links'
import { getProjectCoverForUsage } from '@/utils/project-cover'

import type { APIRoute, ImageMetadata } from 'astro'

type SearchThumbFields = Partial<Pick<SearchIndexEntry, 'coverAvifUrl' | 'coverUrl'>>

const searchThumb = async (
  cover: ImageMetadata | undefined
): Promise<SearchThumbFields> => {
  if (!cover) return {}

  const [webp, avif] = await Promise.all([
    getImage({ format: 'webp', src: cover, width: 200 }),
    getImage({ format: 'avif', src: cover, width: 200 })
  ])

  return {
    coverAvifUrl: avif.src,
    coverUrl: webp.src
  }
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
      ...(await searchThumb(post.data.coverImage?.src))
    }))
  )

  const projectEntries = await Promise.all(
    projects.map(async (project): Promise<SearchIndexEntry> => {
      const thumbnail = getProjectCoverForUsage(project.data.coverImage, 'thumbnail')

      return {
        description: project.data.description,
        path: getPortfolioPath(project.id),
        tags: project.data.technologies,
        title: project.data.title,
        type: project.data.typesId === 'community' ? 'community' : 'project',
        ...(await searchThumb(thumbnail))
      }
    })
  )

  const entries = [...postEntries, ...projectEntries]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
