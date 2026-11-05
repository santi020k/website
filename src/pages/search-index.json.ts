// cspell:words Archivo Biografía Carrera Casos Charlas Comunidad Conferencias Contacto Contratar Currículum estudio
// cspell:words Experiencia Historia Hoja juntos Mapa mí Países Perfil Portafolio Proyectos Sobre Sitio Talleres Trabajemos Trayectoria Versiones Viajes vida
import { getImage } from 'astro:assets'

import type { SearchIndexEntry } from '@/types/search'
import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { getPortfolioPath, getPostPath } from '@/utils/links'
import { getProjectCoverForUsage } from '@/utils/project-cover'

import type { APIRoute, ImageMetadata } from 'astro'

const corePageEntries: SearchIndexEntry[] = [
  {
    description: 'Engineering story, leadership philosophy, and personal background of Santiago Molina.',
    keywords: ['Sobre mí', 'Biografía', 'Perfil', 'Biography', 'Santiago Molina'],
    path: '/about/',
    tags: [],
    title: 'About',
    type: 'page'
  },
  {
    description: 'Career timeline, engineering leadership roles, and production systems delivered since 2014.',
    keywords: ['Experiencia', 'Trayectoria', 'Carrera', 'Career', 'Timeline', 'Experience'],
    path: '/work/',
    tags: [],
    title: 'Work',
    type: 'page'
  },
  {
    description: 'Selected engineering case studies, open-source packages, and community initiatives.',
    keywords: ['Proyectos', 'Portafolio', 'Casos de estudio', 'Portfolio', 'Case studies'],
    path: '/projects/',
    tags: [],
    title: 'Projects',
    type: 'page'
  },
  {
    description: 'Conference talks, workshops, community organizing, and open-source mentorship.',
    keywords: ['Charlas', 'Conferencias', 'Talleres', 'Comunidad', 'Talks', 'Workshops'],
    path: '/speaking/',
    tags: [],
    title: 'Speaking & Community',
    type: 'page'
  },
  {
    description: 'Interactive atlas and field notes from countries and cities visited around the world.',
    keywords: ['Viajes', 'Mapa', 'Países', 'Countries', 'Atlas'],
    path: '/travel/',
    tags: [],
    title: 'Travel',
    type: 'page'
  },
  {
    description: 'Printable curriculum vitae, career highlights, and downloadable PDF resume.',
    keywords: ['Currículum', 'CV', 'Hoja de vida', 'Curriculum Vitae', 'PDF'],
    path: '/resume/',
    tags: [],
    title: 'Resume',
    type: 'page'
  },
  {
    description: 'Get in touch about engineering leadership roles, architecture consulting, or speaking invitations.',
    keywords: ['Trabajemos juntos', 'Contacto', 'Contratar', 'Contact', 'Hire', 'Consulting'],
    path: '/work-with-me/',
    tags: [],
    title: 'Work with me',
    type: 'page'
  },
  {
    description: 'Interactive archive of every major version of santi020k.com from v1 to v5.',
    keywords: ['Historia del sitio', 'Archivo', 'Versiones', 'Archive', 'History'],
    path: '/history/',
    tags: [],
    title: 'Website history',
    type: 'page'
  }
]

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

  const entries = [...postEntries, ...projectEntries, ...corePageEntries]

  return new Response(JSON.stringify(entries), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
