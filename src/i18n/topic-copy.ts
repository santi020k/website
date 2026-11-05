import { topicNoteMessages } from './catalogs/topic-notes.ts'
import type { Locale } from './locale.ts'
import { defaultLocale } from './locale.ts'
import { createTranslator } from './messages.ts'

const translate = createTranslator(topicNoteMessages)
const hasTopicNote = (tag: string): tag is keyof typeof topicNoteMessages => Object.hasOwn(topicNoteMessages, tag)

/** Unknown tags retain the page's localized generic description until a note is authored. */
export const getBlogTopicNote = (tag: string, locale: Locale = defaultLocale): string | undefined => {
  if (!hasTopicNote(tag)) return undefined

  return translate(locale)(tag)
}
