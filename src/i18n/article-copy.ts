import { articleMessages } from './catalogs/article.ts'
import type { Locale } from './locale.ts'
import { createSourceLocalizer, createTranslator } from './messages.ts'

export const articleTranslator = createTranslator(articleMessages)

const localizeSource = createSourceLocalizer(articleMessages)

export const localizeArticleSource = (locale: Locale, text: string): string => {
  if (locale === 'en') return text

  const translated = localizeSource(locale, text)

  if (translated !== text) return translated

  return text
    .replace(/^Copy link to section: /u, 'Copiar enlace a la sección: ')
    .replace(/^Try again to copy link to section: /u, 'Vuelve a intentar copiar el enlace a la sección: ')
    .replace(/^Copied link to section: /u, 'Enlace copiado a la sección: ')
    .replace(/^(\d+) lines · Copy includes the complete example$/u, '$1 líneas · Se copia el ejemplo completo')
    .replace(/^Code example (\d+): /u, 'Ejemplo de código $1: ')
    .replace(/^Table (\d+)(?=:|$)/u, 'Tabla $1')
    .replace(/^Preview, first (\d+) lines: Code example (\d+): /u, 'Vista previa, primeras $1 líneas: ejemplo de código $2: ')
    .replace(/^Preview, first (\d+) lines: /u, 'Vista previa, primeras $1 líneas: ')
}
