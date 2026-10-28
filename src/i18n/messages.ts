import type { Locale } from './locale.ts'
import { defaultLocale } from './locale.ts'

interface FallbackMessage {
  readonly en: string
  readonly es?: string
}

export interface Message extends FallbackMessage {
  readonly es: string
}

export type MessageCatalog = Readonly<Record<string, Message>>
export type MessageValues = Readonly<Record<string, number | string>>

type LocaleSource = Locale | (() => Locale)

type Placeholders<Text extends string> = Text extends `${string}{${infer Name}}${infer Rest}` ? Name | Placeholders<Rest> : never

type MessageArguments<Text extends string> = [Placeholders<Text>] extends [never] ?
  [values?: MessageValues] :
  [values: Readonly<Record<Placeholders<Text>, number | string>>]

/** Resolve the locale at each call so client controls survive language navigation. */
export const createTranslator = <const Catalog extends Readonly<Record<string, FallbackMessage>>>(catalog: Catalog) => (locale: LocaleSource = defaultLocale) => <Key extends Extract<keyof Catalog, string>>(key: Key, ...args: MessageArguments<Catalog[Key]['en']>): string => {
  const values: MessageValues = args[0] ?? {}
  const activeLocale = typeof locale === 'function' ? locale() : locale
  const message = catalog[key]

  if (!Object.hasOwn(catalog, key) || !message) throw new Error(`Unknown translation key: ${key}`)

  const translation = message[activeLocale]
  const text = translation?.trim() ? translation : message[defaultLocale]

  return text.replace(/\{(\w+)\}/gu, (placeholder: string, name: string) => String(values[name] ?? placeholder))
}

/**
 * Boundary adapter for authored content and generated markup that supplies text,
 * not message IDs. Normal UI code must use the typed translator instead.
 */
export const createSourceLocalizer = (catalog: Readonly<Record<string, FallbackMessage>>) => {
  const messages = new Map(Object.values(catalog).map(message => [message.en, message]))

  return (locale: Locale, source: string): string => {
    if (locale === defaultLocale) return source

    const message = messages.get(source)

    return message?.[locale]?.trim() ? message[locale] : source
  }
}
