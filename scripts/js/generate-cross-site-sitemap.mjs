import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getSiteUrls } from '@santi020k/theme/site'

import { collectSitemapEntries, deduplicateSitemapSources, fetchSitemapText, renderSitemap } from './sitemap.mjs'

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url))
const outputDirectory = path.join(rootDirectory, 'dist')
const rootOrigin = 'https://santi020k.com'
const outputPath = path.join(outputDirectory, 'sitemap.xml')
const themeSiteUrls = getSiteUrls()

const sitemapSources = [
  {
    name: 'Astro Doctor',
    origin: 'https://doctor.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'Dep Beacon',
    origin: 'https://beacon.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'ESLint Config',
    origin: 'https://eslint.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'Lumen',
    origin: 'https://lumen.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'OG',
    origin: 'https://og.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'Auth',
    origin: 'https://auth.santi020k.com',
    sitemap: '/sitemap-index.xml'
  },
  {
    name: 'Between Contractions',
    origin: 'https://between.santi020k.com',
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Theme',
    origin: new URL(themeSiteUrls.hub).origin,
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Chrome Theme',
    origin: new URL(themeSiteUrls.chrome).origin,
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Terminal Theme',
    origin: new URL(themeSiteUrls.terminal).origin,
    sitemap: '/sitemap.xml'
  },
  {
    name: 'VS Code Theme',
    origin: new URL(themeSiteUrls.vscode).origin,
    sitemap: '/sitemap.xml'
  },
  {
    name: 'PostLens',
    origin: 'https://postlens.santi020k.com',
    required: false,
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Workspace Organizer',
    origin: 'https://workspace.santi020k.com',
    required: false,
    sitemap: '/sitemap.xml'
  }
]

const readLocalSitemap = async sitemapUrl => {
  const url = new URL(sitemapUrl)

  if (url.origin !== rootOrigin) throw new Error(`Local sitemap must use ${rootOrigin}`)

  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  const filePath = path.resolve(outputDirectory, relativePath)
  const relativeToOutput = path.relative(outputDirectory, filePath)

  if (relativeToOutput.startsWith('..') || path.isAbsolute(relativeToOutput)) {
    throw new Error(`Local sitemap resolves outside dist: ${sitemapUrl}`)
  }

  return readFile(filePath, 'utf8')
}

const rootEntries = await collectSitemapEntries(
  { origin: rootOrigin, sitemap: '/sitemap-index.xml' }, readLocalSitemap
)

const entries = new Map(rootEntries.map(entry => [entry.url, entry]))
const sourceSummaries = [`root=${rootEntries.length}`]

for (const source of deduplicateSitemapSources(sitemapSources)) {
  try {
    const sourceEntries = await collectSitemapEntries(source, fetchSitemapText)

    for (const entry of sourceEntries) entries.set(entry.url, entry)

    sourceSummaries.push(`${source.name}=${sourceEntries.length}`)
  } catch (error) {
    if (source.required === false) {
      console.warn(`[sitemap] Skipping optional source ${source.name}: ${String(error)}`)

      sourceSummaries.push(`${source.name}=unavailable`)

      continue
    }

    throw error
  }
}

const xml = renderSitemap([...entries.values()])

await writeFile(outputPath, xml, 'utf8')

console.log(`[sitemap] Wrote ${entries.size} cross-site URLs to dist/sitemap.xml`)

console.log(`[sitemap] Sources: ${sourceSummaries.join(', ')}`)
