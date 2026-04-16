import { defineConfig, envField } from 'astro/config'
import icon from 'astro-icon'
import robotsTxt from 'astro-robots-txt'
import webmanifest from 'astro-webmanifest'
import fs from 'node:fs'
// Rehype plugins
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
// Remark plugins
import remarkDirective from 'remark-directive'/* handle ::: directives as nodes */

import { remarkAdmonitions } from './src/plugins/remark-admonitions'/* add admonitions */
import { remarkReadingTime } from './src/plugins/remark-reading-time'
import { siteConfig } from './src/site.config'

import alpinejs from '@astrojs/alpinejs'
import mdx from '@astrojs/mdx'
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap'
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationFocus
} from '@shikijs/transformers'
import tailwindcss from '@tailwindcss/vite'

const enableProductionSourceMaps = process.env.ENABLE_PRODUCTION_SOURCE_MAPS === 'true'

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
      lastmod: new Date(),
      serialize(item) {
        const url = item.url

        // Homepage — highest priority, changes frequently
        if (url === 'https://santi020k.com/' || url === 'https://santi020k.com') {
          return { ...item, changefreq: ChangeFreqEnum.DAILY, priority: 1.0 }
        }

        // Section indexes — important landing pages, checked weekly
        if (
          url === 'https://santi020k.com/blog/' ||
          url === 'https://santi020k.com/portfolio/'
        ) {
          return { ...item, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.9 }
        }

        // Individual blog posts — high value, rarely change after publishing
        if (url.includes('/blog/')) {
          return { ...item, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.8 }
        }

        // Individual portfolio/project pages
        if (url.includes('/portfolio/')) {
          return { ...item, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.8 }
        }

        // About & Speaking — important but stable
        if (url.includes('/about') || url.includes('/speaking')) {
          return { ...item, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.6 }
        }

        // Technology index and detail pages
        if (url.includes('/technologies/')) {
          return { ...item, changefreq: ChangeFreqEnum.WEEKLY, priority: 0.5 }
        }

        // Uses, offline, 404 and everything else — low priority, stable
        return { ...item, changefreq: ChangeFreqEnum.MONTHLY, priority: 0.5 }
      }
    }),
    mdx(),
    robotsTxt(),
    alpinejs(),
    webmanifest({
      // See: https://github.com/alextim/astro-lib/blob/main/packages/astro-webmanifest/README.md
      name: siteConfig.title,
      /* eslint-disable camelcase */
      short_name: 'santi020k',
      description: siteConfig.description,
      lang: siteConfig.lang,
      icon: 'public/favicon-source.png',
      icons: [
        {
          src: 'icons/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png'
        },
        {
          src: 'icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: 'icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
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

    remarkPlugins: [remarkReadingTime, remarkDirective, remarkAdmonitions],
    remarkRehype: {
      footnoteLabelProperties: {
        className: ['']
      },
      footnoteBackContent: '⤴'
    },

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
    ]
  },
  // https://docs.astro.build/en/guides/prefetch/
  prefetch: true,
  site: 'https://santi020k.com/',
  vite: {
    build: {
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
