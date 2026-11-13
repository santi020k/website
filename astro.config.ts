import path from 'node:path'

import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField } from 'astro/config'
import icon from 'astro-icon'
// Rehype plugins
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
// Remark plugins
import remarkDirective from 'remark-directive'/* handle ::: directives as nodes */

import { buildContentSitemapMetadata } from './src/config/content-sitemap'
import { defaultLocale, locales, stripLocale } from './src/i18n'
import { codeHighlightingOptions } from './src/plugins/code-highlighting'
import { externalLinkRel } from './src/plugins/external-link-rel'
import { rehypeArticleChecklists } from './src/plugins/rehype-article-checklists'
import { rehypeArticleFigures } from './src/plugins/rehype-article-figures'
import { rehypeArticleHeadings } from './src/plugins/rehype-article-headings'
import { rehypeArticleOpening } from './src/plugins/rehype-article-opening'
import { rehypeArticleQuotes } from './src/plugins/rehype-article-quotes'
import { rehypeArticleReferences } from './src/plugins/rehype-article-references'
import { rehypeCodeTokenClasses } from './src/plugins/rehype-code-token-classes'
import { rehypeLumenCode } from './src/plugins/rehype-lumen-code'
import { rehypePrintReferences } from './src/plugins/rehype-print-references'
import { rehypeProjectLedger } from './src/plugins/rehype-project-ledger'
import { rehypeReadableTables } from './src/plugins/rehype-readable-tables'
import { remarkAdmonitions } from './src/plugins/remark-admonitions'/* add admonitions */
import { isNoindexBuiltPage } from './src/utils/built-page'

const enableProductionSourceMaps = process.env.ENABLE_PRODUCTION_SOURCE_MAPS === 'true'
const siteOrigin = 'https://santi020k.com'
const outDir = path.resolve('dist')

const canonicalContentURL = (value: string): string => {
  const url = new URL(value)

  url.pathname = stripLocale(url.pathname)

  return url.href
}

const {
  lastmodMap: contentLastmodMap,
  nonCanonicalPageUrls
} = await buildContentSitemapMetadata({ siteOrigin })

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
  i18n: { defaultLocale, locales: [...locales], routing: { prefixDefaultLocale: false } },
  redirects: legacyRedirects,
  // Editorial images are local. Leave third-party mention avatars as browser
  // requests so an unavailable author image cannot fail the static build.
  integrations: [
    icon(),
    sitemap({
      i18n: { defaultLocale, locales: { en: 'en', es: 'es' } },
      // Draft filtering happens at route level (getStaticPaths / getCachedPosts / getAllProjects)
      // so draft pages never generate URLs and are never included in the sitemap.
      filter: page => !page.endsWith('/offline/') &&
        !page.endsWith('/404/') &&
        !page.endsWith('/work-with-me/sent/') &&
        !nonCanonicalPageUrls.has(page) &&
        // Pages render first, so their robots directive decides: Spanish shells of English
        // articles and thin archives stay reachable without being submitted for indexing.
        !isNoindexBuiltPage(outDir, page),
      serialize(item) {
        const contentLastmod = contentLastmodMap.get(canonicalContentURL(item.url))

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
            // Owned sites and profiles keep search signals; third-party links stay nofollow.
            rel: externalLinkRel,
            target: '_blank'
          }
        ],

        [rehypePrettyCode, codeHighlightingOptions],
        rehypeLumenCode,
        rehypeArticleQuotes,
        rehypeReadableTables,
        rehypeProjectLedger,
        rehypeArticleChecklists,
        rehypeUnwrapImages,
        rehypeArticleFigures,
        rehypeArticleReferences,
        rehypeArticleOpening,
        rehypeArticleHeadings,
        [rehypePrintReferences, { site: siteOrigin }],
        // Last: every code transformation above has settled its token spans.
        rehypeCodeTokenClasses
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
  site: siteOrigin,
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
      }),
      // Site token from Cloudflare dashboard → Web Analytics. Leave unset to ship no beacon.
      CLOUDFLARE_WEB_ANALYTICS_TOKEN: envField.string({
        context: 'client',
        access: 'public',
        optional: true
      })
    }
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
