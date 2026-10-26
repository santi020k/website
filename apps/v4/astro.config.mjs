import { unified } from '@astrojs/markdown-remark'
import { santi020kDarkShikiTheme, santi020kLightShikiTheme } from '@santi020k/theme/shiki'
import { archiveConfig } from '@santi020k/website-history/config'
import { transformerMetaHighlight, transformerNotationDiff, transformerNotationFocus } from '@shikijs/transformers'
import tailwindcss from '@tailwindcss/vite'
import rehypeExternalLinks from 'rehype-external-links'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeUnwrapImages from 'rehype-unwrap-images'
import remarkDirective from 'remark-directive'

import { rehypeLumenCode } from './src/plugins/rehype-lumen-code'
import { remarkAdmonitions } from './src/plugins/remark-admonitions'
import { remarkReadingTime } from './src/plugins/remark-reading-time'

export default {
  ...archiveConfig('v4', []),
  markdown: {
    syntaxHighlight: false,
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkDirective, remarkAdmonitions],
      rehypePlugins: [
        [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }],
        [rehypePrettyCode, {
          theme: { light: santi020kLightShikiTheme, dark: santi020kDarkShikiTheme },
          transformers: [transformerNotationDiff(), transformerMetaHighlight(), transformerNotationFocus()]
        }],
        rehypeLumenCode,
        rehypeUnwrapImages
      ],
      remarkRehype: { footnoteBackContent: '⤴', footnoteLabelProperties: { className: [''] } }
    })
  },
  build: { inlineStylesheets: 'auto' },
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/libphonenumber-js/')) return 'phone-formatting'

            return null
          }
        }
      }
    }
  }
}
