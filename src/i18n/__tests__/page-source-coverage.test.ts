import { type ContentEntry, readContent } from '@santi020k/og/content'
import current from '@santi020k/website-history/current'
import versions from '@santi020k/website-history/versions'
import { describe, expect, test } from 'vitest'

import { resumeProjectIds } from '@/data/resume'
import { travelPageDescription } from '@/data/travel'
import { contactResultProjectIds } from '@/data/work-with-me'
import { localizePageSource } from '@/i18n/page-copy'
import { AUTHOR_JOB_TITLE, siteConfig } from '@/site.config'

/**
 * `localizePageSource` finds Spanish copy by its English text, so editing the English
 * silently drops the translation. Every string a page passes through it must either
 * resolve in the page catalog or be listed here as the same in both languages.
 */
const sameInBothLanguages = new Set([
  // Talk tags are technology names.
  'AngularJS',
  'CSS',
  'CSS-in-JS',
  'DX',
  'Frontend',
  'Hooks',
  'Next.js',
  'React',
  'Sass',
  'SSR',
  'Storybook',
  // Talk locations are place names.
  'Bogotá',
  'Medellín',
  'Ruta N, Medellín',
  'Universidad EAFIT, Medellín',
  'WeWork, Medellín'
])

const isTranslation = (entry: ContentEntry) => /\.es\.mdx?$/u.test(entry.filePath)
const entryId = (entry: ContentEntry) => entry.slug
const strings = (value: unknown): string[] => {
  if (typeof value === 'string') return value.trim() ? [value] : []
  if (Array.isArray(value)) return value.flatMap(strings)

  return []
}

const collectSources = async () => {
  const sources: { source: string, where: string }[] = []
  const add = (where: string, value: unknown) => {
    for (const source of strings(value)) sources.push({ source, where })
  }

  const talks = await readContent({ directory: 'src/content/talk', exclude: ['AGENTS.md'] })

  for (const talk of talks) {
    if (talk.frontmatter.draft === true) continue

    for (const field of ['title', 'description', 'audience', 'location', 'tags']) {
      add(`talk ${entryId(talk)} ${field}`, talk.frontmatter[field])
    }
  }

  const projects = new Map((await readContent({ directory: 'src/content/project', exclude: ['AGENTS.md'] }))
    .filter(entry => !isTranslation(entry))
    .map(entry => [entryId(entry), entry]))
  const project = (id: string) => {
    const entry = projects.get(id)

    if (!entry) throw new Error(`Missing project ${id}`)

    return entry
  }

  for (const id of Object.values(resumeProjectIds).flat()) {
    for (const field of ['role', 'description', 'impactMetrics']) add(`résumé ${id} ${field}`, project(id).frontmatter[field])
  }

  for (const entry of projects.values()) {
    if (entry.frontmatter.typesId !== 'community' || entry.frontmatter.draft === true) continue

    for (const field of ['role', 'impactMetrics']) add(`speaking ${entryId(entry)} ${field}`, entry.frontmatter[field])
  }

  for (const id of contactResultProjectIds) {
    add(`work-with-me ${id} first metric`, strings(project(id).frontmatter.impactMetrics)[0])
  }

  for (const era of [current, ...versions]) {
    add(`history ${era.id} title`, era.title)
    add(`history ${era.id} description`, era.description)
  }

  add('AUTHOR_JOB_TITLE', AUTHOR_JOB_TITLE)
  add('siteConfig.availability', siteConfig.availability)
  add('travelPageDescription', travelPageDescription)

  return sources
}

describe('page source translations', () => {
  test('every English source passed to localizePageSource has Spanish copy', async () => {
    const sources = await collectSources()
    const missing = sources
      .filter(({ source }) => !sameInBothLanguages.has(source.trim()))
      .filter(({ source }) => localizePageSource('es', source) === source)
      .map(({ source, where }) => `${where}: ${source}`)

    expect(sources.length).toBeGreaterThan(50)
    expect(missing).toEqual([])
  })

  test('the same-in-both-languages list has no stale entries', async () => {
    const seen = new Set((await collectSources()).map(({ source }) => source.trim()))

    expect([...sameInBothLanguages].filter(source => !seen.has(source))).toEqual([])
  })
})
