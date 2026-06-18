import { defineConfig, envField } from 'astro/config'
import icon from 'astro-icon'
import robotsTxt from 'astro-robots-txt'
import webmanifest from 'astro-webmanifest'
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
// Rehype plugins
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
// Remark plugins
import remarkDirective from 'remark-directive'/* handle ::: directives as nodes */

import { remarkAdmonitions } from './src/plugins/remark-admonitions'/* add admonitions */
import { remarkReadingTime } from './src/plugins/remark-reading-time'
import { siteConfig } from './src/site.config'
import { getPostSlug } from './src/utils/posts'

import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap'
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationFocus
} from '@shikijs/transformers'
import tailwindcss from '@tailwindcss/vite'

const enableProductionSourceMaps = process.env.ENABLE_PRODUCTION_SOURCE_MAPS === 'true'

/**
 * Builds a Map<absoluteUrl, ISO lastmod string> for content-collection routes
 * by reading frontmatter from disk at build time. Used by the sitemap's
 * `serialize` callback so each post/project entry advertises its real publish/
 * update date instead of a uniform build timestamp.
 */
const buildContentLastmodMap = (): Map<string, string> => {
  const siteOrigin = 'https://santi020k.com'
  const lastmodMap = new Map<string, string>()
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/

  const walk = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return []

    const out: string[] = []

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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

  const register = (url: string, frontmatter: Record<string, unknown>, prefer: string[]) => {
    for (const key of prefer) {
      const iso = toIso(frontmatter[key])

      if (iso) {
        lastmodMap.set(url, iso)

        return
      }
    }
  }

  // Posts: src/content/post/**/<slug>(/index)?.md(x) -> /blog/<slug>/
  for (const file of walk(path.resolve('src/content/post'))) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const raw = fs.readFileSync(file, 'utf8')
      const match = frontmatterRegex.exec(raw)

      if (!match) continue

      const data = yaml.load(match[1] ?? '') as Record<string, unknown> | null

      if (!data || data.draft === true) continue

      const relative = path.relative(path.resolve('src/content/post'), file).replace(/\\/g, '/')
      const id = relative.replace(/\.mdx?$/, '')
      const slug = getPostSlug(id)

      register(`${siteOrigin}/blog/${slug}/`, data, ['updatedDate', 'publishDate'])
    } catch {
      /* ignore unreadable files */
    }
  }

  // Projects: src/content/project/<slug>(/index)?.md(x) -> /portfolio/<slug>/
  for (const file of walk(path.resolve('src/content/project'))) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const raw = fs.readFileSync(file, 'utf8')
      const match = frontmatterRegex.exec(raw)

      if (!match) continue

      const data = yaml.load(match[1] ?? '') as Record<string, unknown> | null

      if (!data || data.draft === true) continue

      const relative = path.relative(path.resolve('src/content/project'), file).replace(/\\/g, '/')
      const id = relative.replace(/\.mdx?$/, '').replace(/\/index$/, '')
      const slug = id.split('/').pop() ?? id

      register(`${siteOrigin}/portfolio/${slug}/`, data, ['endingDate', 'startingDate'])
    } catch {
      /* ignore unreadable files */
    }
  }

  return lastmodMap
}

const contentLastmodMap = buildContentLastmodMap()

const rawFonts = (ext: string[]) => ({
  name: 'vite-plugin-raw-fonts',
  transform(_: string, id: string) {
    if (ext.some(e => id.endsWith(e))) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
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
      filter: () => true,
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
      policy: [{ userAgent: '*', allow: '/', disallow: ['/search-index.json'] }]
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
              light: 'catppuccin-latte',
              dark: 'catppuccin-mocha'
            },

            transformers: [
              transformerNotationDiff(),
              transformerMetaHighlight(),
              transformerNotationFocus()
            ]
          }
        ],
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
