import { describe, expect, test } from 'vitest'

import { renderArticleCode } from '../article-code'

const render = async (code: string, language = 'typescript', label = 'examples/source.ts') => {
  const html = await renderArticleCode({ code, codeLabel: `Example: ${label}`, label, language })
  const container = document.createElement('div')
  container.innerHTML = html

  return container
}

describe('imported article code', () => {
  test('keeps a 24-line example fully expanded, excluding its trailing newline', async () => {
    const source = `${Array.from({ length: 24 }, (_, index) => `const line${index + 1} = ${index + 1}`).join('\n')}\n`
    const result = await render(source)

    expect(result.querySelector('details')).toBeNull()
    expect(result.querySelectorAll('pre')).toHaveLength(1)
    expect(result.querySelector('pre')?.textContent).toBe(source)
  })

  test('folds 25 lines with a complete source and an independent 12-line preview', async () => {
    const source = `${Array.from({ length: 25 }, (_, index) => `const line${index + 1} = ${index + 1}`).join('\n')}\n`
    const result = await render(source)
    const details = result.querySelector('details')
    const preview = result.querySelector('[data-code-preview]')

    expect(details?.open).toBe(false)
    expect(details?.querySelector('summary')?.textContent).toContain('25 lines')
    expect(details?.querySelector('pre')?.textContent).toBe(source)
    expect(preview?.querySelectorAll('[data-line]')).toHaveLength(12)
    expect(preview?.querySelector('pre')?.textContent).toBe(source.split('\n').slice(0, 12).join('\n'))
    expect(preview?.querySelector('pre')?.getAttribute('aria-label')).toContain('Preview, first 12 lines')
    expect(result.querySelectorAll('[data-ui-scroll-cue]')).toHaveLength(2)
    expect(result.querySelectorAll('[data-scroll-cue-message]')).toHaveLength(2)
    expect(result.querySelector('[data-copy-value]')?.getAttribute('data-copy-value')).toBe(source.trim())
  })

  test('preserves literal markup, fences, whitespace, and notation comments as code', async () => {
    const source = 'const html = "<script>alert(1)</script> & quoted"\n\n  // [!code --]\nconst fence = "```"'
    const result = await render(source)

    expect(result.querySelector('pre code')?.textContent).toBe(source)
    expect(result.querySelector('[data-copy-value]')?.getAttribute('data-copy-value')).toBe(source.trim())
    expect(result.querySelector('script')).toBeNull()
    expect(result.querySelectorAll('figure')).toHaveLength(1)
  })

  test('renders the shared folio with a complete escaped filename and named scroll region', async () => {
    const label = 'examples/a "quoted" <filename>.ts'
    const result = await render('export const answer = 42', 'typescript', label)

    expect(result.querySelector('figcaption')?.textContent).toContain(label)
    expect(result.querySelector('pre')?.getAttribute('aria-label')).toBe(`Example: ${label}`)
    expect(result.querySelector('pre')?.getAttribute('tabindex')).toBe('0')
    expect(result.querySelector('[data-copy-label]')?.getAttribute('data-copy-label')).toBe('Copy code to clipboard')
    expect(result.querySelector('[data-slot="copy-idle"]')?.textContent).toBe('Copy')
    expect(result.querySelector('[data-line-numbers] [data-line]')).not.toBeNull()
    expect(result.querySelector('[data-scroll-cue-message]')?.hasAttribute('hidden')).toBe(true)
    // Lumen assigns IDs across the assembled page, avoiding collisions with Markdown examples.
    expect(result.querySelector('[data-scroll-cue-message]')?.hasAttribute('id')).toBe(false)
  })

  test('keeps shell alternatives in one imported example', async () => {
    const source = 'npm install example\n# or\npnpm add example'
    const result = await render(source, 'bash')

    expect(result.querySelectorAll('figure')).toHaveLength(1)
    expect(result.querySelector('pre code')?.textContent).toBe(source)
    expect(result.querySelector('[role="tablist"]')).toBeNull()
  })

  test('isolates labels and source across concurrent imported examples', async () => {
    const sources = ['export const first = 1', 'export const second = 2']
    const results = await Promise.all(sources.map((source, index) => render(source, 'typescript', `file-${index}.ts`)))

    results.forEach((result, index) => {
      expect(result.querySelector('pre code')?.textContent).toBe(sources[index])
      expect(result.querySelector('pre')?.getAttribute('aria-label')).toBe(`Example: file-${index}.ts`)
    })
  })
})
