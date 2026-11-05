import { pageMessages } from './catalogs/page.ts'
import type { Locale } from './locale.ts'
import { createSourceLocalizer, createTranslator } from './messages.ts'

export const pageTranslator = createTranslator(pageMessages)

const localizeSource = createSourceLocalizer(pageMessages)

/** Authored content may lack a translation; preserve it and its surrounding whitespace. */
export const localizePageSource = (locale: Locale, source: string): string => {
  if (locale === 'en') return source

  const normalized = source.replace(/\s+/gu, ' ').trim()
  const translated = localizeSource(locale, normalized)

  return translated === normalized ? source : source.replace(/\S[\s\S]*\S|\S/u, () => translated)
}
