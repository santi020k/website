import { codeHighlightingOptions } from '@/plugins/code-highlighting'
import { rehypeCodeTokenClasses } from '@/plugins/rehype-code-token-classes'
import { type ImportedCodeMetadata, rehypeLumenCode } from '@/plugins/rehype-lumen-code'

import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import type { Root } from 'mdast'
import rehypePrettyCode from 'rehype-pretty-code'
import type { Plugin } from 'unified'

export interface ArticleCodeOptions extends ImportedCodeMetadata {
  code: string
  language: string
}

/** Render literal imported source through the article's shared Code folio pipeline. */
export const renderArticleCode = async ({ code, codeLabel, label, language }: ArticleCodeOptions): Promise<string> => {
  const importedSource: Plugin<[], Root> = () => tree => {
    // A code node keeps backticks and HTML in the source from becoming Markdown markup.
    tree.children = [{ lang: language, type: 'code', value: code }]
  }

  const processor = await createMarkdownProcessor({
    syntaxHighlight: false,
    remarkPlugins: [importedSource],
    rehypePlugins: [
      // Notation comments in an imported file are source text, not highlight directives.
      [rehypePrettyCode, { ...codeHighlightingOptions, grid: false, transformers: [] }],
      [rehypeLumenCode, { imported: { codeLabel, copyValue: code.trim(), label } }],
      rehypeCodeTokenClasses
    ]
  })

  return (await processor.render('')).code
}
