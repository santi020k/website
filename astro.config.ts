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
import sitemap from '@astrojs/sitemap'
import {
  transformerMetaHighlight,
  transformerNotationDiff
} from '@shikijs/transformers'
import tailwindcss from '@tailwindcss/vite'

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
    domains: ['webmention.io', 'cdn-images-1.medium.com', 'cdn-images-2.medium.com', 'miro.medium.com']
  },
  integrations: [
    icon(),
    sitemap(),
    mdx(),
    robotsTxt(),
    alpinejs(),
    webmanifest({
    // See: https://github.com/alextim/astro-lib/blob/main/packages/astro-webmanifest/README.md
    /**
     * required
     **/
      name: siteConfig.title,

      /**
     * optional
     **/
      /* eslint-disable camelcase */
      short_name: 'Santi020k',
      description: siteConfig.description,
      lang: siteConfig.lang,
      icon: 'public/logo-square.webp', // the source for generating favicon & icons
      icons: [
        {
          src: 'icons/apple-touch-icon.png', // used in src/components/BaseHead.astro L:26
          sizes: '180x180',
          type: 'image/png'
        },
        {
          src: 'icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      start_url: '/',
      background_color: '#1d1f21',
      theme_color: '#000000',
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
            light: 'rose-pine-dawn', // after changing the theme, the server needs to be restarted
            dark: 'rose-pine' // after changing the theme, the server needs to be restarted
          },

          transformers: [transformerNotationDiff(), transformerMetaHighlight()]
        }
      ],
      rehypeUnwrapImages
    ]
  },
  // https://docs.astro.build/en/guides/prefetch/
  prefetch: true,
  site: 'https://santi020k.me/',
  vite: {
    build: {
      sourcemap: true // Source maps generation
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
