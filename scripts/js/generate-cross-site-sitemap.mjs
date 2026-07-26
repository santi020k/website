import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { XMLParser } from 'fast-xml-parser'

const rootDirectory = fileURLToPath(new URL('../..', import.meta.url))
const outputDirectory = path.join(rootDirectory, 'dist')
const rootOrigin = 'https://santi020k.com'
const outputPath = path.join(outputDirectory, 'sitemap.xml')
const parser = new XMLParser()
const retryCount = 3

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
    origin: 'https://theme.santi020k.com',
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Chrome Theme',
    origin: 'https://chrome.santi020k.com',
    sitemap: '/sitemap.xml'
  },
  {
    name: 'Terminal Theme',
    origin: 'https://terminal.santi020k.com',
    sitemap: '/sitemap.xml'
  },
  {
    name: 'VS Code Theme',
    origin: 'https://vscode.santi020k.com',
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

const asArray = value => {
  if (value === undefined) return []

  return Array.isArray(value) ? value : [value]
}

const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&apos;')

const parseSitemap = (xml, sitemapUrl) => {
  const document = parser.parse(xml)
  const nestedSitemaps = asArray(document.sitemapindex?.sitemap).map(entry => entry.loc)
  const pageUrls = asArray(document.urlset?.url).map(entry => entry.loc)

  if (nestedSitemaps.length === 0 && pageUrls.length === 0) {
    throw new Error(`${sitemapUrl} is not a sitemap index or URL set`)
  }

  return { nestedSitemaps, pageUrls }
}

const assertUrlOrigin = (value, expectedOrigin, label) => {
  const url = new URL(value)

  if (url.origin !== expectedOrigin) {
    throw new Error(`${label} uses ${url.origin}; expected ${expectedOrigin}`)
  }

  return url
}

const readLocalSitemap = async sitemapUrl => {
  const url = assertUrlOrigin(sitemapUrl, rootOrigin, 'Local sitemap')
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

const collectSitemapUrls = async ({ origin, sitemap }, loadSitemap) => {
  const initialUrl = new URL(sitemap, origin).href
  const pending = [initialUrl]
  const visited = new Set()
  const pageUrls = []

  while (pending.length > 0) {
    const sitemapUrl = pending.shift()

    if (!sitemapUrl || visited.has(sitemapUrl)) continue

    assertUrlOrigin(sitemapUrl, origin, 'Nested sitemap')

    visited.add(sitemapUrl)

    const xml = await loadSitemap(sitemapUrl)
    const parsed = parseSitemap(xml, sitemapUrl)

    for (const nestedSitemap of parsed.nestedSitemaps) {
      const nestedUrl = assertUrlOrigin(nestedSitemap, origin, 'Nested sitemap')

      pending.push(nestedUrl.href)
    }

    for (const pageUrl of parsed.pageUrls) {
      const url = assertUrlOrigin(pageUrl, origin, 'Sitemap URL')

      if (url.protocol !== 'https:') {
        throw new Error(`Sitemap URL must use HTTPS: ${url.href}`)
      }

      pageUrls.push(url.href)
    }
  }

  return pageUrls
}

const rootUrls = await collectSitemapUrls(
  { origin: rootOrigin, sitemap: '/sitemap-index.xml' }, readLocalSitemap
)

const urls = new Set(rootUrls)
const sourceSummaries = [`root=${rootUrls.length}`]

for (const source of sitemapSources) {
  try {
    const sourceUrls = await collectSitemapUrls(source, fetchText)

    for (const url of sourceUrls) urls.add(url)

    sourceSummaries.push(`${source.name}=${sourceUrls.length}`)
  } catch (error) {
    if (source.required === false) {
      console.warn(`[sitemap] Skipping optional source ${source.name}: ${String(error)}`)

      sourceSummaries.push(`${source.name}=unavailable`)

      continue
    }

    throw error
  }
}

const entries = [...urls]
  .sort((left, right) => left.localeCompare(right))
  .map(url => `  <url><loc>${escapeXml(url)}</loc></url>`)
  .join('\n')

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  entries,
  '</urlset>',
  ''
].join('\n')

await writeFile(outputPath, xml, 'utf8')

console.log(`[sitemap] Wrote ${urls.size} cross-site URLs to dist/sitemap.xml`)

console.log(`[sitemap] Sources: ${sourceSummaries.join(', ')}`)
