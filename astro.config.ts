import fs from 'node:fs'
import path from 'node:path'

import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap'
import {
  santi020kDarkShikiTheme,
  santi020kLightShikiTheme
} from '@santi020k/theme/shiki'
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationFocus
} from '@shikijs/transformers'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'
import icon from 'astro-icon'
import robotsTxt from 'astro-robots-txt'
import webmanifest from 'astro-webmanifest'
import { load as loadYaml } from 'js-yaml'
// Rehype plugins
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
// Remark plugins
import remarkDirective from 'remark-directive'/* handle ::: directives as nodes */

import { rehypeLumenCode } from './src/plugins/rehype-lumen-code'
import { remarkAdmonitions } from './src/plugins/remark-admonitions'/* add admonitions */
import { remarkReadingTime } from './src/plugins/remark-reading-time'
import { siteConfig } from './src/site.config'
import { getPostSlug } from './src/utils/posts'

const enableProductionSourceMaps = process.env.ENABLE_PRODUCTION_SOURCE_MAPS === 'true'

/**
 * Builds sitemap metadata for content-collection routes from frontmatter.
 * Last-modified dates let entries advertise real content changes, while pages
 * that declare another canonical URL are omitted to avoid conflicting signals.
 */
const buildContentSitemapMetadata = () => {
  const siteOrigin = 'https://santi020k.com'
  const lastmodMap = new Map<string, string>()
  const nonCanonicalPageUrls = new Set<string>()
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/

  const walk = (dir: string): string[] => {
    const out: string[] = []
    let entries: fs.Dirent[]

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return []
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        out.push(...walk(full))
      } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
        out.push(full)
      }
    }

    return out
  }

  const toIso = (value: unknown): string | undefined => {
    if (value instanceof Date) return value.toISOString()

    if (typeof value === 'string') {
      const date = new Date(value)

      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    }

    return undefined
  }

  type FrontmatterDateKey = 'date' | 'endingDate' | 'pubDate' | 'publishDate' | 'startingDate' | 'updatedDate'

  const frontmatterDate = (frontmatter: Record<string, unknown>, key: FrontmatterDateKey) => {
    switch (key) {
      case 'date':
        return frontmatter.date

      case 'endingDate':
        return frontmatter.endingDate

      case 'pubDate':
        return frontmatter.pubDate

      case 'publishDate':
        return frontmatter.publishDate

      case 'startingDate':
        return frontmatter.startingDate

      case 'updatedDate':
        return frontmatter.updatedDate
    }
  }

  const register = (
    url: string,
    frontmatter: Record<string, unknown>,
    prefer: FrontmatterDateKey[]
  ) => {
    for (const key of prefer) {
      const iso = toIso(frontmatterDate(frontmatter, key))

      if (iso) {
        lastmodMap.set(url, iso)

        return
      }
    }
  }

  // Posts: src/content/post/**/<slug>(/index)?.md(x) -> /blog/<slug>/
  for (const file of walk(path.resolve('src/content/post'))) {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      const match = frontmatterRegex.exec(raw)

      if (!match) continue

      const data = loadYaml(match[1] ?? '') as Record<string, unknown> | null

      if (!data || data.draft === true) continue

      const relative = path.relative(path.resolve('src/content/post'), file).replace(/\\/g, '/')
      const id = relative.replace(/\.mdx?$/, '')
      const slug = getPostSlug(id)
      const pageUrl = `${siteOrigin}/blog/${slug}/`

      if (typeof data.canonicalUrl === 'string' && data.canonicalUrl !== pageUrl) {
        nonCanonicalPageUrls.add(pageUrl)
      }

      register(pageUrl, data, ['updatedDate', 'publishDate'])
    } catch {
      /* ignore unreadable files */
    }
  }

  // Projects: src/content/project/<slug>(/index)?.md(x) -> /portfolio/<slug>/
  for (const file of walk(path.resolve('src/content/project'))) {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      const match = frontmatterRegex.exec(raw)

      if (!match) continue

      const data = loadYaml(match[1] ?? '') as Record<string, unknown> | null

      if (!data || data.draft === true) continue

      const relative = path.relative(path.resolve('src/content/project'), file).replace(/\\/g, '/')
      const id = relative.replace(/\.mdx?$/, '').replace(/\/index$/, '')
      const slug = id.split('/').pop() ?? id

      register(`${siteOrigin}/portfolio/${slug}/`, data, ['endingDate', 'startingDate'])
    } catch {
      /* ignore unreadable files */
    }
  }

  return { lastmodMap, nonCanonicalPageUrls }
}

const {
  lastmodMap: contentLastmodMap,
  nonCanonicalPageUrls
} = buildContentSitemapMetadata()

// Keep only redirects that must work in Astro's local preview. The larger set
// of legacy technology URLs is emitted as real HTTP 301 rules for production
// by generate-cloudflare-redirects.mjs. Adding those routes here would also
// create hundreds of static redirect documents that crawlers can rediscover.
const legacyRedirects: Record<string, string> = {
  '/blog/content-calendar/': '/blog/',
  '/blog/tags/hombrew/': '/blog/tags/homebrew/'
}

const rawFonts = (ext: string[]) => ({
  name: 'vite-plugin-raw-fonts',
  transform(_: string, id: string) {
    if (ext.some(e => id.endsWith(e))) {
      const buffer = fs.readFileSync(id)

      return {
        code: `export default ${JSON.stringify(buffer)}`,
        map: null
      }
    }

    return null
  }
})

// https://astro.build/config
export default defineConfig({
  redirects: legacyRedirects,
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: 'webmention.io' },
      { protocol: 'https', hostname: 'cdn-images-1.medium.com' },
      { protocol: 'https', hostname: 'cdn-images-2.medium.com' },
      { protocol: 'https', hostname: 'miro.medium.com' }
    ]
  },
  integrations: [
    icon(),
    sitemap({
      // Draft filtering happens at route level (getStaticPaths / getCachedPosts / getAllProjects)
      // so draft pages never generate URLs and are never included in the sitemap.
      filter: page => !page.endsWith('/offline/') &&
        !page.endsWith('/404/') &&
        !nonCanonicalPageUrls.has(page),
      serialize(item) {
        const url = item.url
        const contentLastmod = contentLastmodMap.get(url)
        const next: typeof item = contentLastmod ? { ...item, lastmod: contentLastmod } : { ...item }

        // Homepage — highest priority, changes frequently
        if (url === 'https://santi020k.com/' || url === 'https://santi020k.com') {
          return { ...next, changefreq: ChangeFreqEnum.DAILY, priority: 1.0 }
        }

        // Section indexes — important landing pages, checked weekly
        if (
          url === 'https://santi020k.com/blog/' ||
          url === 'https://santi020k.com/portfolio/'
        ) {
          return { ...next, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.9 }
        }

        // Individual blog posts — high value, rarely change after publishing
        if (url.includes('/blog/')) {
          return { ...next, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.8 }
        }

        // Individual portfolio/project pages
        if (url.includes('/portfolio/')) {
          return { ...next, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.8 }
        }

        // About & Speaking — important but stable
        if (url.includes('/about') || url.includes('/speaking')) {
          return { ...next, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.6 }
        }

        // Technology index and detail pages
        if (url.includes('/technologies/')) {
          return { ...next, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.5 }
        }

        // Uses, offline, 404 and everything else — low priority, stable
        return { ...next, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.5 }
      }
    }),
    mdx(),
    robotsTxt({
      // The search-index.json blob is intended for the in-page site search and
      // duplicates content already crawlable from posts/projects. Keep it out
      // of search results so listings stay clean.
      policy: [{ userAgent: '*', allow: '/', disallow: ['/search-index.json'] }],
      sitemap: 'https://santi020k.com/sitemap.xml'
    }),
    webmanifest({
      // See: https://github.com/alextim/astro-lib/blob/main/packages/astro-webmanifest/README.md
      name: siteConfig.title,
      /* eslint-disable camelcase */
      short_name: 'santi020k',
      description: siteConfig.description,
      lang: siteConfig.lang,
      icon: 'public/favicon-source.webp',
      icons: [
        {
          src: 'apple-touch-icon.webp',
          sizes: '180x180',
          type: 'image/webp'
        },
        {
          src: 'icons/icon-192.webp',
          sizes: '192x192',
          type: 'image/webp',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-512.webp',
          sizes: '512x512',
          type: 'image/webp',
          purpose: 'any maskable'
        }
      ],
      id: '/',
      scope: '/',
      start_url: '/',
      background_color: '#09040f',
      theme_color: '#09040f',
      /* eslint-enable camelcase */
      display: 'standalone',
      config: {
        insertFaviconLinks: false,
        insertThemeColorMeta: false,
        insertManifestLink: false
      }
    })
  ],
  markdown: {
    syntaxHighlight: false,

    processor: unified({
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            rel: ['nofollow', 'noreferrer'],
            target: '_blank'
          }
        ],

        [
          rehypePrettyCode,
          {
            theme: {
              light: santi020kLightShikiTheme,
              dark: santi020kDarkShikiTheme
            },

            transformers: [
              transformerNotationDiff(),
              transformerMetaHighlight(),
              transformerNotationFocus()
            ]
          }
        ],
        rehypeLumenCode,
        rehypeUnwrapImages
      ],
      remarkPlugins: [remarkReadingTime, remarkDirective, remarkAdmonitions],
      remarkRehype: {
        footnoteBackContent: '⤴',
        footnoteLabelProperties: {
          className: ['']
        }
      }
    })
  },
  // https://docs.astro.build/en/guides/prefetch/
  prefetch: true,
  site: 'https://santi020k.com/',
  vite: {
    build: {
      // Drop the Vite modulepreload polyfill — all browsers we target (Chrome 66+,
      // Firefox 115+, Safari 17.5+) support <link rel="modulepreload"> natively.
      // Removing it cuts one level from the critical JS chain.
      modulePreload: { polyfill: false },
      sourcemap: process.env.NODE_ENV !== 'production' || enableProductionSourceMaps,
      rollupOptions: {
        onwarn(warning, warn) {
          if (
            warning.code === 'UNUSED_EXTERNAL_IMPORT' &&
            warning.message.includes('@astrojs/internal-helpers/remote')
          ) {
            return
          }

          warn(warning)
        },
        output: {
          // Prevent Rollup from splitting tiny shared modules into separate chunks.
          // Files under ~4 KiB that are only used by Astro page/layout scripts get
          // merged back into the chunk that imports them, reducing HTTP round-trips.
          manualChunks(id) {
            if (
              (id.includes('astro/dist/runtime') || id.includes('@astrojs/')) &&
              !id.includes('client-router')
            ) {
              return 'astro-runtime'
            }

            return null
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['@resvg/resvg-js']
    },
    plugins: [rawFonts(['.ttf', '.woff']), tailwindcss()]
  },
  env: {
    schema: {
      WEBMENTION_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      WEBMENTION_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true
      }),
      WEBMENTION_PINGBACK: envField.string({
        context: 'client',
        access: 'public',
        optional: true
      })
    }
  },
  server: {
    // port: 1234,
    host: true
  },
  build: {
    inlineStylesheets: 'always' // Ensures one global CSS bundle
  }
})
