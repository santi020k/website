import { describe, expect, test } from 'vitest'

import { addProjectReadingBrief } from '../project-reading-brief'

const opening = (body = '<p>A short introduction.</p>') => `<section data-project-context-lead><p>Project notes</p><h2 id="opening">Opening</h2>${body}</section>`

describe('project Reading brief', () => {
  test('includes rendered component text and preserves the original narrative and heading fragments', () => {
    const lead = opening()
    const content = `<section><h3 id="results">Results</h3><p data-component-output>${'word '.repeat(400)}</p></section>`
    const html = lead + content
    const result = addProjectReadingBrief(html)
    expect(result).toContain('<h2 id="opening">Opening</h2><dl data-project-reading-brief>')
    expect(result).toContain('About 3 minutes')
    expect(result).toContain('1 section')
    expect(result.endsWith(content)).toBe(true)
    expect(result.replace(/<dl data-project-reading-brief>[\s\S]*?<\/dl>/u, '')).toBe(html)
    expect(addProjectReadingBrief(result)).toBe(result)
  })

  test('excludes executable content, styles, code blocks, controls, and comments from the estimate and section count', () => {
    const excluded = ['script', 'style', 'pre', 'button', 'dialog', 'template'].map(tag => `<${tag}>${'word '.repeat(1000)}<h3>Not a chapter</h3></${tag}>`).join('')
    const result = addProjectReadingBrief(opening() + excluded + `<!-- ${'word '.repeat(1000)}<h2>Not a chapter</h2> -->`)
    expect(result).toContain('About 1 minute')
    expect(result).not.toContain('In this project story')
    expect(result).toContain(excluded)
  })

  test('counts chapters and subsections but not capability headings or the opening', () => {
    const result = addProjectReadingBrief(opening() + '<h2>Chapter</h2><h3>First section</h3><h3>Second section</h3><h4>Capability</h4>')
    expect(result).toContain('3 sections')
  })

  test('handles inline formatting and quoted angle brackets without introducing extra words', () => {
    const html = `<section data-project-context-lead><h2>Opening</h2><p>${'word '.repeat(198)}rea<strong title="A > B">d</strong>able</p></section>`
    expect(addProjectReadingBrief(html)).toContain('About 1 minute')
  })

  test('treats encoded spaces as word boundaries', () => {
    const result = addProjectReadingBrief(opening(`<p>${Array.from({ length: 201 }, () => 'word').join('&nbsp;')}</p>`))
    expect(result).toContain('About 2 minutes')
  })

  test('ignores fake opening markup in a comment and inserts after the actual heading', () => {
    const comment = '<!-- <section data-project-context-lead><h2>Fake opening</h2></section> -->'
    const result = addProjectReadingBrief(comment + opening() + '<h2>Chapter</h2>', 'es')

    expect(result).toContain(comment)
    expect(result).toContain('<h2 id="opening">Opening</h2><dl data-project-reading-brief>')
    expect(result).toContain('1 sección')
  })

  test('does not alter content without a complete context opening', () => {
    for (const html of [
      '',
      '<h2>Article</h2>',
      '<section data-project-context-lead><h2>Unclosed opening section</h2>',
      '<section data-project-context-lead><p>Introduction</p></section><h2>Later chapter</h2>'
    ]) {
      expect(addProjectReadingBrief(html)).toBe(html)
    }
  })
})
