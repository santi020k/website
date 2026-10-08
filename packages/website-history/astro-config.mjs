import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import remarkDirective from 'remark-directive'

import { finalizeArchive } from './finalize-archive.mjs'
import versions from './versions.json' with { type: 'json' }

/**
 * @param {string} id
 * @param {import('unified').PluggableList} remarkPlugins
 * @param {import('unified').PluggableList} [rehypePlugins]
 */
export const archiveConfig = (id, remarkPlugins, rehypePlugins = []) => {
  const version = versions.find(item => item.id === id)

  if (!version) throw new Error(`Unknown website archive: ${id}`)

  return defineConfig({
    site: 'https://santi020k.com',
    base: `/${id}/`,
    trailingSlash: 'always',
    integrations: [icon(), mdx(), {
      name: 'website-history',
      hooks: {
        'astro:build:done': ({ dir }) => finalizeArchive(dir, version)
      }
    }],
    markdown: {
      syntaxHighlight: false,
      processor: unified({
        remarkPlugins: [remarkDirective, ...remarkPlugins],
        rehypePlugins: [
          [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
          [rehypePrettyCode, { theme: { light: 'rose-pine-dawn', dark: 'rose-pine' } }],
          rehypeUnwrapImages,
          ...rehypePlugins
        ]
      })
    },
    image: { remotePatterns: [{ protocol: 'https', hostname: 'webmention.io' }] },
    vite: { plugins: [tailwindcss()] }
  })
}
