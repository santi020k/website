import { santi020kDarkShikiTheme, santi020kLightShikiTheme, type Santi020kShikiTheme } from '@santi020k/theme/shiki'
import { transformerMetaHighlight, transformerNotationDiff, transformerNotationFocus } from '@shikijs/transformers'
import type { Options } from 'rehype-pretty-code'

const themeTokens = (theme: Santi020kShikiTheme) => theme.tokenColors.map(({ name, scope, settings = {} }) => ({
  ...(name ? { name } : {}),
  ...(scope ? { scope } : {}),
  settings: {
    ...(typeof settings.foreground === 'string' ? { foreground: settings.foreground } : {}),
    ...(typeof settings.background === 'string' ? { background: settings.background } : {}),
    ...(typeof settings.fontStyle === 'string' ? { fontStyle: settings.fontStyle } : {})
  }
}))

const commentColor = santi020kLightShikiTheme.colors.descriptionForeground

const lightTokens = [
  ...themeTokens(santi020kLightShikiTheme),
  ...(commentColor ?
    [{
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: commentColor, fontStyle: 'italic' }
    }] :
    [])
]

const darkTokens = themeTokens(santi020kDarkShikiTheme)

export const codeHighlightingOptions = {
  theme: {
    light: {
      name: santi020kLightShikiTheme.name,
      type: santi020kLightShikiTheme.type,
      colors: santi020kLightShikiTheme.colors,
      settings: lightTokens,
      tokenColors: lightTokens
    },
    dark: {
      name: santi020kDarkShikiTheme.name,
      type: santi020kDarkShikiTheme.type,
      colors: santi020kDarkShikiTheme.colors,
      settings: darkTokens,
      tokenColors: darkTokens
    }
  },
  transformers: [transformerNotationDiff(), transformerMetaHighlight(), transformerNotationFocus()]
} satisfies Options
