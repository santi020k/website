// cspell:words Archivo Biografía Carrera Casos Charlas Comunidad Conferencias Contacto Contratar Currículum estudio
// cspell:words Experiencia Historia Hoja juntos Mapa mí Países Perfil Portafolio Proyectos Sobre Sitio Talleres Trabajemos Trayectoria Versiones Viajes vida
import { getImage } from 'astro:assets'

import type { SearchIndexEntry } from '@/types/search'
import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { localizePost, localizeProject } from '@/utils/content-translations'
import { getPortfolioPath, getPostPath } from '@/utils/links'
import { getProjectCoverForUsage } from '@/utils/project-cover'

import type { APIRoute, ImageMetadata } from 'astro'

import type { Locale } from '@/i18n'
import { localizePath, sharedTranslator } from '@/i18n'
import { localizePageSource, pageTranslator } from '@/i18n/page-copy'

const corePageEntries = (locale: Locale): SearchIndexEntry[] => {
  const t = pageTranslator(locale)

  return [
    {
      description: t('search.page.about'),
      keywords: ['Sobre mí', 'Biografía', 'Perfil', 'Biography', 'Santiago Molina'],
      path: '/about/',
      tags: [],
      title: 'About',
      type: 'page'
    },
    {
      description: t('search.page.work'),
      keywords: ['Experiencia', 'Trayectoria', 'Carrera', 'Career', 'Timeline', 'Experience'],
      path: '/work/',
      tags: [],
      title: 'Work',
      type: 'page'
    },
    {
      description: t('search.page.projects'),
      keywords: ['Proyectos', 'Portafolio', 'Casos de estudio', 'Portfolio', 'Case studies'],
      path: '/projects/',
      tags: [],
      title: sharedTranslator(locale)('nav.projects'),
      type: 'page'
    },
    {
      description: t('search.page.speaking'),
      keywords: ['Charlas', 'Conferencias', 'Talleres', 'Comunidad', 'Talks', 'Workshops'],
      path: '/speaking/',
      tags: [],
      title: 'Speaking & Community',
      type: 'page'
    },
    {
      description: t('search.page.travel'),
      keywords: ['Viajes', 'Mapa', 'Países', 'Countries', 'Atlas'],
      path: '/travel/',
      tags: [],
      title: 'Travel',
      type: 'page'
    },
    {
      description: t('search.page.resume'),
      keywords: ['Currículum', 'CV', 'Hoja de vida', 'Curriculum Vitae', 'PDF'],
      path: '/resume/',
      tags: [],
      title: 'Resume',
      type: 'page'
    },
    {
      description: t('search.page.workWithMe'),
      keywords: ['Trabajemos juntos', 'Contacto', 'Contratar', 'Contact', 'Hire', 'Consulting'],
      path: '/work-with-me/',
      tags: [],
      title: 'Work with me',
      type: 'page'
    },
    {
      description: t('search.page.history'),
      keywords: ['Historia del sitio', 'Archivo', 'Versiones', 'Archive', 'History'],
      path: '/history/',
      tags: [],
      title: 'Website history',
      type: 'page'
    }
  ]
}

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

export const createSearchIndex = async (locale: Locale) => {
  const [originalPosts, originalProjects] = await Promise.all([getCachedPosts(), getCachedProjects()])
  const posts = await Promise.all(originalPosts.map(post => localizePost(post, locale)))
  const projects = await Promise.all(originalProjects.map(project => localizeProject(project, locale)))

  const postEntries = await Promise.all(
    posts.map(async (post): Promise<SearchIndexEntry> => ({
      description: post.data.description,
      path: localizePath(getPostPath(post.id), locale),
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
        path: localizePath(getPortfolioPath(project.id), locale),
        tags: project.data.technologies,
        title: project.data.title,
        type: project.data.typesId === 'community' ? 'community' : 'project',
        ...(await searchThumb(thumbnail))
      }
    })
  )

  const pageEntries = corePageEntries(locale).map(entry => ({
    ...entry,
    path: localizePath(entry.path, locale),
    title: localizePageSource(locale, entry.title)
  }))

  const entries = [...postEntries, ...projectEntries, ...pageEntries]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}

export const GET: APIRoute = () => createSearchIndex('en')
