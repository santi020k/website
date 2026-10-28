import type { Locale } from '@/i18n'
import { localizeArticleSource } from '@/i18n/article-copy'

const generatedControl = /\bdata-(?:ui-code-copy|code-complete|code-preview|prose-table|scroll-cue-viewport)(?:[\s=>])/u
const controlAttribute = /\b(aria-label|title|data-copy-label|data-copy-copied-label|data-copy-error-label)="([^"]*)"/gu

const controlText = new RegExp(
  String.raw`(<span\b[^>]*\b(?:data-fold-(?:expand|collapse|count)|` +
  String.raw`data-slot="copy-(?:idle|copied|error)")[^>]*>)([^<]*)(<\/span>)`,
  'gu'
)

const controlLanguage = (open: string): string => /\blang=/u.test(open) ? open : open.replace(/>$/u, ' lang="es-419">')

/** Only existing generated markers qualify; authored markup is never a translation source. */
const translateGeneratedControls = (html: string, locale: Locale): string => {
  const attributes = html.replace(/<(button|pre|div)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gu, tag => {
    if (!generatedControl.test(tag)) return tag

    const translated = tag.replace(controlAttribute,
      (_attribute, name: string, value: string) => `${name}="${localizeArticleSource(locale, value)}"`)

    return translated.startsWith('<button') ? controlLanguage(translated) : translated
  })

  const labels = attributes.replace(controlText,
    (_match, open: string, value: string, close: string) => `${controlLanguage(open)}${localizeArticleSource(locale, value)}${close}`)

  return labels.replace(/(<div\b[^>]*\bdata-scroll-cue-message[^>]*>[\s\S]*?<span\b[^>]*>)([^<]*)(<\/span>)/gu,
    (_match, open: string, value: string, close: string) => {
      const localizedOpen = open.replace(/<span\b[^>]*>$/u, tag => controlLanguage(tag))

      return `${localizedOpen}${localizeArticleSource(locale, value)}${close}`
    })
}

/**
 * Markdown is rendered once for both language shells. Localize only the known
 * generated control markers, preserving code payloads and authored prose.
 * Active/raw-text elements may contain literal examples and stay verbatim.
 */
export const localizeArticleControls = (html: string, locale: Locale): string => {
  if (locale === 'en') return html

  const parts: string[] = []
  let previousEnd = 0

  for (const match of html.matchAll(/<(script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/giu)) {
    parts.push(translateGeneratedControls(html.slice(previousEnd, match.index), locale), match[0])

    previousEnd = match.index + match[0].length
  }

  parts.push(translateGeneratedControls(html.slice(previousEnd), locale))

  return parts.join('')
}
