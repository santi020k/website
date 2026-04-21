import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getPostPath } from '@/utils/links'

import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const [posts, projects] = await Promise.all([getCachedPosts(), getCachedProjects()])

  const entries = [
    ...posts.map(post => ({
      description: post.data.description,
      path: getPostPath(post.id),
      tags: post.data.tags,
      title: post.data.title,
      type: 'post' as const
    })),
    ...projects.map(project => ({
      description: project.data.description,
      path: getPortfolioPath(project.id),
      tags: project.data.technologies,
      title: project.data.title,
      type: 'project' as const
    }))
  ]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
