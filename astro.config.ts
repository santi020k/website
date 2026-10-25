import fs from 'node:fs'
import path from 'node:path'

import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
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
import { load as loadYaml } from 'js-yaml'
// Rehype plugins
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
// Remark plugins
import remarkDirective from 'remark-directive'/* handle ::: directives as nodes */

import { rehypeArticleFigures } from './src/plugins/rehype-article-figures'
import { rehypeArticleHeadings } from './src/plugins/rehype-article-headings'
import { rehypeArticleOpening } from './src/plugins/rehype-article-opening'
import { rehypeArticleQuotes } from './src/plugins/rehype-article-quotes'
import { rehypeLumenCode } from './src/plugins/rehype-lumen-code'
import { rehypeProjectLedger } from './src/plugins/rehype-project-ledger'
import { rehypeReadableTables } from './src/plugins/rehype-readable-tables'
import { remarkAdmonitions } from './src/plugins/remark-admonitions'/* add admonitions */
import { parseContentDate } from './src/utils/content-date'
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

  // Matches the content schema so sitemap dates and scheduling agree in every build timezone.
  const toIso = (value: unknown): string | undefined => {
    if (!(value instanceof Date) && typeof value !== 'string') return undefined

    const date = parseContentDate(value)

    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
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

      const publishDate = toIso(data.publishDate)

      if (publishDate && new Date(publishDate) > new Date()) continue

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

      // Project start/end dates describe the work, not this case study's latest edit.
      register(`${siteOrigin}/portfolio/${slug}/`, data, ['updatedDate'])
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

// https://astro.build/config
export default defineConfig({
  redirects: legacyRedirects,
  // Editorial images are local. Leave third-party mention avatars as browser
  // requests so an unavailable author image cannot fail the static build.
  integrations: [
    icon(),
    sitemap({
      // Draft filtering happens at route level (getStaticPaths / getCachedPosts / getAllProjects)
      // so draft pages never generate URLs and are never included in the sitemap.
      filter: page => !page.endsWith('/offline/') &&
        !page.endsWith('/404/') &&
        !nonCanonicalPageUrls.has(page),
      serialize(item) {
        const contentLastmod = contentLastmodMap.get(item.url)

        return contentLastmod ? { ...item, lastmod: contentLastmod } : item
      }
    }),
    mdx()
  ],
  markdown: {
    syntaxHighlight: false,

    processor: unified({
      rehypePlugins: [
        [
          rehypeExternalLinks,
          {
            rel: ['nofollow', 'noopener', 'noreferrer'],
            target: '_blank'
          }
        ],

        [
          rehypePrettyCode,
          {
            theme: {
              light: {
                ...santi020kLightShikiTheme,
                tokenColors: [
                  ...santi020kLightShikiTheme.tokenColors,
                  // Keep comments readable on the website's light code surface.
                  {
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                      foreground: santi020kLightShikiTheme.colors.descriptionForeground,
                      fontStyle: 'italic'
                    }
                  }
                ]
              },
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
        rehypeArticleQuotes,
        rehypeReadableTables,
        rehypeProjectLedger,
        rehypeUnwrapImages,
        rehypeArticleFigures,
        rehypeArticleOpening,
        rehypeArticleHeadings
      ],
      remarkPlugins: [remarkDirective, remarkAdmonitions],
      remarkRehype: {
        footnoteBackContent: '↩',
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
            // Phone formatting stays behind Lumen's conditional phone-input
            // import. Split its metadata from flag artwork so neither lazy
            // chunk exceeds the bundle budget on this site.
            if (id.includes('/libphonenumber-js/')) return 'phone-formatting'

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
    plugins: [tailwindcss()]
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
    host: true
  },
  build: {
    // The global bundle (Tailwind + Lumen UI + site partials) is ~420 KiB raw.
    // Inlining it copied that payload into every one of the ~440 documents, so it
    // could never be cached across pages and every `prefetch` hover re-downloaded
    // it. `auto` keeps tiny page-scoped stylesheets inline and emits the global
    // bundle as a hashed `/_astro/` asset, which `public/_headers` already serves
    // as `immutable`. Documents drop from ~627 KiB to ~204 KiB (~93 KiB to ~30 KiB
    // over the wire). Lighthouse lab scores are unchanged either way (performance
    // 91, LCP/FCP/SI within run-to-run noise over 3 runs each); the win is transfer
    // and caching across a multi-page site, not first-paint timing.
    inlineStylesheets: 'auto'
  }
})
