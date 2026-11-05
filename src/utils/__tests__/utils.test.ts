import { describe, expect, test } from 'vitest'

import {
  getNavigationCurrent,
  getPortfolioPath,
  getPostPath,
  getSeriesPath,
  getTagPath,
  getTechnologyPath,
  getTechnologySlug
} from '../links'

// ─── links ────────────────────────────────────────────────────────────────────

describe('links', () => {
  test.each([
    ['/', '/', 'page'],
    ['/blog', '/blog/', 'page'],
    ['/blog/', '/blog/', 'page'],
    ['/blog/story/', '/blog/', 'true'],
    ['/blog/story/', '/', undefined],
    ['/blogger/', '/blog/', undefined],
    ['/about/', '/blog/', undefined]
  ])('identifies the navigation state of %s for %s', (pathname, path, expected) => {
    expect(getNavigationCurrent(pathname, path)).toBe(expected)
  })

  test('returns the correct canonical path for a blog post', () => {
    expect(getPostPath('my-post')).toBe('/blog/my-post/')
  })

  test('returns the correct canonical path for a series', () => {
    expect(getSeriesPath('my-series')).toBe('/blog/series/my-series/')
  })

  test('returns the correct canonical path for a tag archive', () => {
    expect(getTagPath('developer experience')).toBe('/blog/tags/developer%20experience/')
  })

  test('URI-encodes reserved characters in tag archive paths', () => {
    expect(getTagPath('ci/cd')).toBe('/blog/tags/ci%2Fcd/')
  })

  test('returns the correct canonical path for a portfolio project', () => {
    expect(getPortfolioPath('my-project')).toBe('/portfolio/my-project/')
  })

  test('returns the correct canonical path for a plain technology name', () => {
    expect(getTechnologyPath('react')).toBe('/technologies/react/')
  })

  test('slugifies technology names for canonical paths', () => {
    expect(getTechnologyPath('Design Systems')).toBe('/technologies/design-systems/')
    expect(getTechnologyPath('C#')).toBe('/technologies/c-sharp/')
    expect(getTechnologyPath('C++')).toBe('/technologies/c-plus-plus/')
  })

  test('normalizes technology slug case and punctuation', () => {
    expect(getTechnologySlug('React.js')).toBe('react-js')
    expect(getTechnologySlug('NPM')).toBe(getTechnologySlug('npm'))
    expect(getTechnologySlug('CI/CD')).toBe('ci-cd')
  })

  test('always wraps the slug with leading and trailing slashes', () => {
    expect(getPostPath('slug').startsWith('/')).toBe(true)
    expect(getPostPath('slug').endsWith('/')).toBe(true)
  })
})
