import type { CollectionEntry } from 'astro:content'

import { getCachedPosts, getCachedProjects } from '@/utils/content'
import { collectionDateSortProjects, collectionRelevanceSortProjects } from '@/utils/date'
import { getPortfolioPath, getPostPath, getSeriesPath } from '@/utils/links'
import { formatLlmsLink, formatLlmsSection } from '@/utils/llms'

import type { APIContext } from 'astro'

import { getSeriesSummaries } from '@/data/series'
import { siteConfig } from '@/site.config'

/** Primary destinations in navigation order. Descriptions summarize each page for AI readers. */
const pages = [
  { title: 'About', path: '/about/', description: 'Background, working principles, and life outside code.' },
  { title: 'Experience', path: '/work/', description: 'Engineering roles since 2014 across commerce, media, esports, and developer tools.' },
  { title: 'Case studies', path: '/portfolio/', description: 'Professional and personal work with the decisions and outcomes behind it.' },
  { title: 'Projects', path: '/projects/', description: 'Developer tools, apps, and experiments with their technology stacks.' },
  { title: 'Writing', path: '/blog/', description: 'Articles on software decisions, tooling, books, games, and everyday experiences.' },
  { title: 'Speaking', path: '/speaking/', description: 'Talks, workshops, and community work.' },
  { title: 'Résumé', path: '/resume/', description: 'A readable web résumé with concise and full PDF downloads.' },
  { title: 'Work with me', path: '/work-with-me/', description: 'Services and the ways to start a conversation.' },
  { title: 'Travel', path: '/travel/', description: 'An interactive country map and personal travel notebook.' },
  { title: 'Website history', path: '/history/', description: 'Five design eras of this website, with the archived versions.' }
]

export const GET = async ({ site }: APIContext) => {
  const origin = site ?? new URL('https://santi020k.com/')
  const absolute = (path: string) => new URL(path, origin).href

  const [posts, projects, seriesSummaries] = await Promise.all([
    getCachedPosts(),
    getCachedProjects(),
    getSeriesSummaries()
  ])

  const caseStudies = projects.filter(project => project.data.typesId === 'professional').sort(collectionDateSortProjects)
  const ownProjects = projects.filter(project => project.data.typesId !== 'professional').sort(collectionRelevanceSortProjects)

  const projectLink = (project: CollectionEntry<'project'>) => formatLlmsLink(
    project.data.title,
    absolute(getPortfolioPath(project.id)),
    project.data.seoDescription ?? project.data.description
  )

  const body = [
    `# ${siteConfig.author}`,
    `> ${siteConfig.description}`,
    [
      `This is the personal website of ${siteConfig.author} (santi020k), based in ${siteConfig.location}.`,
      'English is the primary language. A Latin American Spanish edition lives under `/es/`, with',
      'translated articles and case studies; entries without a translation are shown in English there.',
      'New articles are announced in the',
      `[RSS feed](${absolute('/feed.xml')}) and [JSON Feed](${absolute('/feed.json')}), and translated`,
      `articles in the [Spanish RSS feed](${absolute('/es/feed.xml')}) and`,
      `[Spanish JSON Feed](${absolute('/es/feed.json')}).`
    ].join(' '),
    formatLlmsSection('Pages', pages.map(page => formatLlmsLink(page.title, absolute(page.path), page.description))),
    formatLlmsSection('Case studies', caseStudies.map(projectLink)),
    formatLlmsSection('Projects', ownProjects.map(projectLink)),
    formatLlmsSection('Series', seriesSummaries.map(({ series }) => formatLlmsLink(
      series.data.title, absolute(getSeriesPath(series.id)), series.data.seoDescription ?? series.data.description
    ))),
    formatLlmsSection('Articles', posts.map(post => formatLlmsLink(
      post.data.title, absolute(getPostPath(post.id)), post.data.description
    ))),
    formatLlmsSection('Optional', [
      formatLlmsLink('Spanish home', absolute('/es/'), 'The same site with a Latin American Spanish interface.'),
      formatLlmsLink('Accessibility statement', absolute('/accessibility/'), 'Accessibility scope and how to report a problem.'),
      formatLlmsLink('Sitemap', absolute('/sitemap.xml'), 'Every indexable page, including other santi020k.com sites.')
    ])
  ].filter(Boolean).join('\n\n')

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
