import { describe, expect, test } from 'vitest'

import { localizePageSource } from '../page-copy'
import { getDiscussionTerm, getFeedPath, getLocale, hasTranslation, localeLanguage, localizePath, sharedTranslator, stripLocale } from '..'

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

  test('gives each language its own feeds without localizing the endpoint paths themselves', () => {
    expect(getFeedPath('en')).toBe('/feed.xml')
    expect(getFeedPath('es')).toBe('/es/feed.xml')
    expect(getFeedPath('en', 'json')).toBe('/feed.json')
    expect(getFeedPath('es', 'json')).toBe('/es/feed.json')
    expect(localizePath('/feed.xml', 'es')).toBe('/feed.xml')
  })

  test('leaves archives, external links, downloads and endpoints unchanged', () => {
    for (const path of ['/v4/about/', '/pdf/cv.pdf', '/feed.xml', '/search-index.json', '//example.com/', 'https://example.com/', '#chapter', '/unknown/']) {
      expect(hasTranslation(path)).toBe(false)
      expect(localizePath(path, 'es')).toBe(path)
    }
  })

  test('keeps comments attached to the existing English discussion identity', () => {
    expect(getDiscussionTerm('/es/blog/article/')).toBe('blog/article/')
    expect(getDiscussionTerm('/blog/article/')).toBe('blog/article/')
    expect(getDiscussionTerm('/es/')).toBe('index')
    expect(getDiscussionTerm('/es/blog/article.html')).toBe('blog/article')
  })

  test('keeps English source text and translates interpolated UI safely', () => {
    expect(sharedTranslator('en')('search.title')).toBe('Search')
    expect(sharedTranslator('es')('search.title')).toBe('Buscar')
    expect(localizePageSource('es', 'A product name')).toBe('A product name')
    expect(sharedTranslator('es')('shared.titlePositionOfTotal', { position: 2, title: 'Astro', total: 3 })).toBe('Astro, 2 de 3')
    expect(localizePageSource('es', '{missing}')).toBe('{missing}')
  })
})
