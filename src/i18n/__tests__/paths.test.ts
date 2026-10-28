import { describe, expect, test } from 'vitest'

import { getLocale, hasTranslation, localeLanguage, localizePath, stripLocale, translate } from '..'

describe('current-site locales', () => {
  test('recognizes complete locale segments without confusing English paths', () => {
    expect(getLocale('/es/about/')).toBe('es')
    expect(getLocale('/es')).toBe('es')
    expect(getLocale('/essays/')).toBe('en')
    expect(stripLocale('/es/')).toBe('/')
    expect(localeLanguage('es')).toBe('es-419')
  })

  test('localizes routes idempotently while retaining queries and fragments', () => {
    expect(localizePath('/blog/2/?tag=astro#results', 'es')).toBe('/es/blog/2/?tag=astro#results')
    expect(localizePath('/es/blog/2/?tag=astro#results', 'es')).toBe('/es/blog/2/?tag=astro#results')
    expect(localizePath('/es/blog/2/?tag=astro#results', 'en')).toBe('/blog/2/?tag=astro#results')
    expect(localizePath('/', 'es')).toBe('/es/')
    expect(localizePath('/portfolio/lumen-ui/', 'es')).toBe('/es/portfolio/lumen-ui/')
  })

  test('leaves archives, external links, downloads and endpoints unchanged', () => {
    for (const path of ['/v4/about/', '/pdf/cv.pdf', '/feed.xml', '/search-index.json', '//example.com/', 'https://example.com/', '#chapter', '/unknown/']) {
      expect(hasTranslation(path)).toBe(false)
      expect(localizePath(path, 'es')).toBe(path)
    }
  })

  test('keeps English source text and translates interpolated UI safely', () => {
    expect(translate('en', 'Search')).toBe('Search')
    expect(translate('es', 'Search')).toBe('Buscar')
    expect(translate('es', 'A product name')).toBe('A product name')
    expect(translate('es', '{title}, {position} of {total}', { position: 2, title: 'Astro', total: 3 })).toBe('Astro, 2 de 3')
    expect(translate('es', '{missing}')).toBe('{missing}')
  })
})
