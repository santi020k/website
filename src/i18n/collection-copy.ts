import { collectionMessages } from './catalogs/collection.ts'
import type { Locale } from './locale.ts'
import { createSourceLocalizer, createTranslator } from './messages.ts'

export const collectionTranslator = createTranslator(collectionMessages)

const localizeSource = createSourceLocalizer(collectionMessages)

export const localizeCollectionSource = (locale: Locale, text: string): string => {
  if (locale === 'en') return text

  const exact = localizeSource(locale, text)

  if (exact !== text) return exact

  return text
    .replace(/^Posts (\d+)–(\d+) of (\d+)$/u, 'Artículos $1–$2 de $3')
    .replace(/^(.+) is the most explored topic\.$/u, '$1 es el tema más explorado.')
    .replace(/^Visit (.+)$/u, 'Visitar $1')
    .replace(/^View (.+) archive$/u, 'Ver el archivo de $1')
    .replace(/^View (.+) previews$/u, 'Ver imágenes de $1')
    .replace(/^Blog posts, page (\d+)$/u, 'Artículos del blog, página $1')
    .replace(/^Older writing from page (\d+) of (\d+), ordered newest first\.$/u, 'Artículos anteriores de la página $1 de $2, de los más recientes a los más antiguos.')
    .replace(/^Articles, guides, and personal notes about (.+)\.$/u, 'Artículos, guías y notas personales sobre $1.')
    .replace(/^Browse earlier posts about (.+)\.$/u, 'Explora artículos anteriores sobre $1.')
    .replace(/^Posts about (.+)$/u, 'Artículos sobre $1')
    .replace(/^(.+) posts(?= · |$)/u, 'Artículos sobre $1')
    .replace(/^(\d+) personal projects$/u, '$1 proyectos personales')
    .replace(/^(\d+) project stories$/u, '$1 historias de proyectos')
    .replace(/^Explore beyond (.+)$/u, 'Explora más allá de $1')
    .replace(/^Explore (\d+) technologies and capabilities through the projects where they appear\.$/u, 'Explora $1 tecnologías y capacidades a través de los proyectos donde se usan.')
    .replace(/^Explore where (.+) shaped the work\.$/u, 'Explora dónde $1 dio forma al trabajo.')
    .replace(/^(.+) · Technology$/u, '$1 · Tecnología')
    .replace(/^(\d+) min read$/u, '$1 min de lectura')
    .replace(/^(.+) technologies$/u, 'Tecnologías de $1')
    .replace(/^Read the (.+) case study$/u, 'Lee el caso de estudio de $1')
    .replace(/^Read the case study: (.+)$/u, 'Leer el caso de estudio: $1')
    .replace(/^Part (\d+)$/u, 'Parte $1')
    .replace(/^All (\d+) (.+)$/u, 'Los $1 $2')
    .replace(/^Browse all (.+)$/u, 'Explorar todos los $1')
    .replace(/Page (\d+) of (\d+)/gu, 'Página $1 de $2')
    .replace(/Page (\d+)/gu, 'Página $1')
}
