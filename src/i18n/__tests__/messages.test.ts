import { describe, expect, expectTypeOf, test } from 'vitest'

import { articleMessages } from '../catalogs/article'
import { collectionMessages } from '../catalogs/collection'
import { pageMessages } from '../catalogs/page'
import { sharedMessages } from '../catalogs/shared'
import type { Locale } from '../locale'
import type { Message, MessageCatalog } from '../messages'
import { createSourceLocalizer, createTranslator } from '../messages'
import { pageTranslator } from '../page-copy'
import { sharedTranslator } from '../shared-copy'
import { defaultLocale, getLocale } from '..'

const placeholders = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\}/gu)].map(match => match[1]))].sort()

describe.each([
  ['shared', sharedMessages],
  ['page', pageMessages],
  ['collection', collectionMessages],
  ['article', articleMessages]
] satisfies [string, MessageCatalog][])('%s translation coverage', (_name: string, catalog: MessageCatalog) => {
  test('keeps source-text boundary lookups unambiguous', () => {
    const translations = new Map<string, string>()

    for (const message of Object.values(catalog)) {
      const previous = translations.get(message.en)

      expect(message.es).toBe(previous ?? message.es)

      translations.set(message.en, message.es)
    }
  })

  test.each(Object.entries(catalog))('%s has both languages and matching interpolation fields', (key: string, message: Message) => {
    expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/u)
    expect(message.en.trim()).not.toBe('')
    expect(message.es.trim()).not.toBe('')
    expect(placeholders(message.es)).toEqual(placeholders(message.en))
  })
})

describe('English-first messages', () => {
  test('defaults to English regardless of browser language or previous Spanish navigation', () => {
    expect(defaultLocale).toBe('en')
    expect(getLocale('/')).toBe('en')
    expect(getLocale('/about/')).toBe('en')
    expect(getLocale('/fr/about/')).toBe('en')
    expect(sharedTranslator()('nav.about')).toBe('About')
    expect(pageTranslator()('home.hero.title')).toBe('I build products.')
    expect(sharedTranslator('es')('nav.about')).toBe('Sobre mí')
    expect(sharedTranslator()('nav.about')).toBe('About')
  })

  test('falls back to English for missing or blank Spanish messages', () => {
    const translator = createTranslator({
      missing: { en: 'Hello {name}' },
      empty: { en: 'Try again', es: '' },
      blank: { en: 'Search', es: '  ' }
    })

    expect(translator('es')('missing', { name: 'Alex' })).toBe('Hello Alex')
    expect(translator('es')('empty')).toBe('Try again')
    expect(translator('es')('blank')).toBe('Search')
  })

  test('English edits keep the same Spanish message attached to its stable key', () => {
    const before = createTranslator({ 'nav.about': { en: 'About', es: 'Sobre mí' } })
    const after = createTranslator({ 'nav.about': { en: 'About me', es: 'Sobre mí' } })

    expect(before()('nav.about')).toBe('About')
    expect(after()('nav.about')).toBe('About me')
    expect(after('es')('nav.about')).toBe(before('es')('nav.about'))
    expectTypeOf<Parameters<ReturnType<typeof after>>[0]>().toEqualTypeOf<'nav.about'>()
    expectTypeOf<string>().not.toExtend<Parameters<ReturnType<typeof after>>[0]>()
  })

  test('interpolates zero and arbitrary authored values once, without replacement expansion', () => {
    const t = createTranslator({ result: { en: '{title}: {count}', es: '{title}: {count}' } })('es')

    expect(t('result', { title: '$& {count} <Astro>', count: 0 })).toBe('$& {count} <Astro>: 0')
  })

  test('client translators read the active locale again after navigation', () => {
    let locale: Locale = 'en'
    const t = sharedTranslator(() => locale)

    expect(t('search.title')).toBe('Search')
    locale = 'es'
    expect(t('search.title')).toBe('Buscar')
    locale = 'en'
    expect(t('search.title')).toBe('Search')
  })

  test('unknown runtime keys fail explicitly instead of displaying internal IDs or inherited properties', () => {
    const catalog: MessageCatalog = { known: { en: 'Known', es: 'Conocido' } }
    const t = createTranslator(catalog)('es')

    for (const key of ['missing', 'constructor', '__proto__', 'toString']) {
      expect(() => t(key)).toThrow(`Unknown translation key: ${key}`)
    }
  })

  test('content boundaries preserve untranslated prose and the English default', () => {
    const localize = createSourceLocalizer({ title: { en: 'About', es: 'Sobre mí' } })

    expect(localize('en', 'About')).toBe('About')
    expect(localize('es', 'About')).toBe('Sobre mí')
    expect(localize('es', 'An authored English title')).toBe('An authored English title')
    expect(localize('es', 'constructor')).toBe('constructor')
  })
})
