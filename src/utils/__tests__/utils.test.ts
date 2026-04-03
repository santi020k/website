import { describe, expect, it } from 'vitest'

import { capitalizeFirstLetter } from '../capitalize-first-letter'
import { elementHasClass, toggleClass } from '../dom-element'
import { generateToc } from '../generate-toc'
import { getPostPath, getProjectPath, getTechnologyPath } from '../links'
import { truncateTitle } from '../truncate-title'

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello')
  })

  it('should handle empty strings', () => {
    expect(capitalizeFirstLetter('')).toBe('')
  })

  it('should handle strings with one character', () => {
    expect(capitalizeFirstLetter('a')).toBe('A')
  })
})

describe('truncateTitle', () => {
  it('should truncate titles longer than 50 characters', () => {
    const longTitle = 'a'.repeat(60)
    expect(truncateTitle(longTitle)).toBe(`${'a'.repeat(50)}...`)
  })

  it('should not truncate short titles', () => {
    expect(truncateTitle('Short Title')).toBe('Short Title')
  })
})

describe('links', () => {
  it('should return correct post path', () => {
    expect(getPostPath('my-post')).toBe('/blog/my-post/')
  })

  it('should return correct project path', () => {
    expect(getProjectPath('my-project')).toBe('/projects/my-project/')
  })

  it('should return correct technology path', () => {
    expect(getTechnologyPath('react')).toBe('/technologies/react/')
    expect(getTechnologyPath('c#')).toBe('/technologies/c%23/')
  })
})

describe('generateToc', () => {
  it('should generate a TOC tree from headings', () => {
    const headings = [
      { depth: 2, slug: 'h2-1', text: 'H2-1' },
      { depth: 3, slug: 'h3-1', text: 'H3-1' },
      { depth: 2, slug: 'h2-2', text: 'H2-2' }
    ]
    const toc = generateToc(headings)
    expect(toc).toHaveLength(2)
    const first = toc[0]
    expect(first?.children).toHaveLength(1)
    expect(first?.children[0]?.text).toBe('H3-1')
  })

  it('should filter headings based on min/max level', () => {
    const headings = [
      { depth: 1, slug: 'h1', text: 'H1' },
      { depth: 2, slug: 'h2', text: 'H2' },
      { depth: 6, slug: 'h6', text: 'H6' }
    ]
    const toc = generateToc(headings, { maxHeadingLevel: 5, minHeadingLevel: 2 })
    expect(toc).toHaveLength(1)
    expect(toc[0]?.text).toBe('H2')
  })

  it('should handle empty headings', () => {
    expect(generateToc([])).toEqual([])
  })
})

describe('dom-element', () => {
  it('should toggle a class', () => {
    const el = document.createElement('div')
    toggleClass(el, 'active')
    expect(el.classList.contains('active')).toBe(true)
    toggleClass(el, 'active')
    expect(el.classList.contains('active')).toBe(false)
  })

  it('should check if element has a class', () => {
    const el = document.createElement('div')
    el.classList.add('test')
    expect(elementHasClass(el, 'test')).toBe(true)
    expect(elementHasClass(el, 'not-here')).toBe(false)
  })
})
