import { describe, expect, test } from 'vitest'

import { capitalizeFirstLetter } from '../capitalize-first-letter'
import { elementHasClass, rootInDarkMode, toggleClass } from '../dom-element'
import { getPortfolioPath, getPostPath, getSeriesPath, getTagPath, getTechnologyPath } from '../links'
import { truncateTitle } from '../truncate-title'

// ─── capitalizeFirstLetter ────────────────────────────────────────────────────

describe('capitalizeFirstLetter', () => {
  test('capitalizes the first letter of a lowercase string', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello')
  })

  test('returns an empty string unchanged', () => {
    expect(capitalizeFirstLetter('')).toBe('')
  })

  test('handles a single character', () => {
    expect(capitalizeFirstLetter('a')).toBe('A')
  })

  test('does not change already-capitalized strings', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello')
  })

  test('only uppercases the first character, leaving the rest unchanged', () => {
    expect(capitalizeFirstLetter('hELLO WORLD')).toBe('HELLO WORLD')
  })
})

// ─── truncateTitle ────────────────────────────────────────────────────────────

describe('truncateTitle', () => {
  test('truncates titles longer than 50 characters with an ellipsis', () => {
    const longTitle = 'a'.repeat(60)
    expect(truncateTitle(longTitle)).toBe(`${'a'.repeat(50)}...`)
  })

  test('does not truncate titles of exactly 50 characters', () => {
    const title = 'a'.repeat(50)
    expect(truncateTitle(title)).toBe(title)
  })

  test('does not truncate short titles', () => {
    expect(truncateTitle('Short Title')).toBe('Short Title')
  })

  test('returns an empty string unchanged', () => {
    expect(truncateTitle('')).toBe('')
  })
})

// ─── links ────────────────────────────────────────────────────────────────────

describe('links', () => {
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

  test('URI-encodes special characters in technology names', () => {
    expect(getTechnologyPath('C#')).toBe('/technologies/C%23/')
    expect(getTechnologyPath('C++')).toBe('/technologies/C%2B%2B/')
  })

  test('always wraps the slug with leading and trailing slashes', () => {
    expect(getPostPath('slug').startsWith('/')).toBe(true)
    expect(getPostPath('slug').endsWith('/')).toBe(true)
  })
})

// ─── dom-element ─────────────────────────────────────────────────────────────

describe('toggleClass', () => {
  test('adds a class when the element does not have it', () => {
    const el = document.createElement('div')
    toggleClass(el, 'active')
    expect(el.classList.contains('active')).toBe(true)
  })

  test('removes a class when the element already has it', () => {
    const el = document.createElement('div')
    el.classList.add('active')
    toggleClass(el, 'active')
    expect(el.classList.contains('active')).toBe(false)
  })

  test('toggles independently for different class names', () => {
    const el = document.createElement('div')
    toggleClass(el, 'foo')
    toggleClass(el, 'bar')
    expect(el.classList.contains('foo')).toBe(true)
    expect(el.classList.contains('bar')).toBe(true)
  })
})

describe('elementHasClass', () => {
  test('returns true when the element has the class', () => {
    const el = document.createElement('div')
    el.classList.add('test')
    expect(elementHasClass(el, 'test')).toBe(true)
  })

  test('returns false when the element does not have the class', () => {
    const el = document.createElement('div')
    expect(elementHasClass(el, 'not-here')).toBe(false)
  })
})

describe('rootInDarkMode', () => {
  test('returns true when <html> has data-theme="dark"', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    expect(rootInDarkMode()).toBe(true)
    document.documentElement.removeAttribute('data-theme')
  })

  test('returns false when <html> does not have data-theme="dark"', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    expect(rootInDarkMode()).toBe(false)
    document.documentElement.removeAttribute('data-theme')
  })

  test('returns false when data-theme attribute is absent', () => {
    document.documentElement.removeAttribute('data-theme')
    expect(rootInDarkMode()).toBe(false)
  })
})
