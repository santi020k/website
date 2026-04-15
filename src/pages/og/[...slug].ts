import { getSeriesPath } from '@/utils/links'
import { renderSocialImage } from '@/utils/render-social-image.js'
import { getSocialImageSlug } from '@/utils/social-image'

import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

import { getUniqueTechnologies } from '@/data/project'
import { getTechnologySocialPage, staticSocialPages } from '@/data/social-pages'

export const getStaticPaths = async () => {
  const posts = await getCollection('post', ({ data }) => import.meta.env.PROD ? !data.draft : true)
  const projects = await getCollection('project', ({ data }) => import.meta.env.PROD ? !data.draft : true)
  const series = await getCollection('series')
  const technologies = getUniqueTechnologies(projects)

  const staticPagePaths = staticSocialPages.map(page => ({
    params: { slug: `pages/${getSocialImageSlug(page.pathname)}.webp` },
    props: {
      description: page.description,
      pathLabel: page.pathname,
      title: page.title,
      type: page.type
    }
  }))

  const postPaths = posts.map(post => ({
    params: { slug: `blog/${post.id}.webp` },
    props: {
      description: post.data.description,
      pathLabel: `/blog/${post.id}/`,
      title: post.data.title,
      type: 'Blog Post'
    }
  }))

  const projectPaths = projects.map(project => ({
    params: { slug: `portfolio/${project.id}.webp` },
    props: {
      description: project.data.seoDescription ?? project.data.description,
      pathLabel: `/portfolio/${project.id}/`,
      title: project.data.title,
      type: 'Project'
    }
  }))

  const seriesPaths = series.map(seriesEntry => ({
    params: { slug: `pages/${getSocialImageSlug(getSeriesPath(seriesEntry.id))}.webp` },
    props: {
      description: seriesEntry.data.seoDescription ?? seriesEntry.data.description,
      pathLabel: getSeriesPath(seriesEntry.id),
      title: seriesEntry.data.seoTitle ?? seriesEntry.data.title,
      type: 'Blog Series'
    }
  }))

  const technologyPaths = technologies.map(technology => {
    const page = getTechnologySocialPage(technology)

    return {
      params: { slug: `pages/${getSocialImageSlug(page.pathname)}.webp` },
      props: {
        description: page.description,
        pathLabel: `/technologies/${technology}/`,
        title: page.title,
        type: page.type
      }
    }
  })

  return [...staticPagePaths, ...postPaths, ...projectPaths, ...seriesPaths, ...technologyPaths]
}

interface OGProps {
  description: string
  pathLabel?: string
  title: string
  type: string
}

export const GET: APIRoute<OGProps> = async ({ props }) => {
  const body = new Uint8Array(await renderSocialImage(props))

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/webp'
    },
    status: 200
  })
}
