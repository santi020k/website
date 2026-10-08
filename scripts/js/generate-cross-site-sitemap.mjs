import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getSiteUrls } from '@santi020k/theme/site'

import { collectSitemapEntries, deduplicateSitemapSources, renderSitemap } from './sitemap.mjs'

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url))
const outputDirectory = path.join(rootDirectory, 'dist')
const rootOrigin = 'https://santi020k.com'
const outputPath = path.join(outputDirectory, 'sitemap.xml')
const retryCount = 3
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
    name: 'Difftale',
    origin: 'https://difftale.santi020k.com',
    required: false,
    sitemap: '/sitemap-index.xml'
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

const fetchText = async url => {
  let lastError

  for (let attempt = 1; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'santi020k-cross-site-sitemap-builder/1.0' },
        signal: AbortSignal.timeout(15_000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.text()
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(`Could not fetch ${url}: ${String(lastError)}`)
}

const rootEntries = await collectSitemapEntries(
  { origin: rootOrigin, sitemap: '/sitemap-index.xml' }, readLocalSitemap
)

const entries = new Map(rootEntries.map(entry => [entry.url, entry]))
const sourceSummaries = [`root=${rootEntries.length}`]

for (const source of deduplicateSitemapSources(sitemapSources)) {
  try {
    const sourceEntries = await collectSitemapEntries(source, fetchText)

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
