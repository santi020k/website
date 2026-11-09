import { describe, expect, test } from 'vitest'

import { renderArticleCode } from '../article-code'
import { localizeArticleControls } from '../article-control-language'

const copyButton = '<button data-ui-code-copy="" aria-label="Copy code to clipboard" title="Copy code to clipboard" data-copy-label="Copy code to clipboard" data-copy-copied-label="Code copied to clipboard" data-copy-error-label="Could not copy code. Select and copy it manually." data-copy-value="const message = &quot;Copy&quot;;"><span data-slot="copy-idle">Copy</span><span data-slot="copy-copied" hidden>Copied</span></button>'

describe('article control language', () => {
  test('preserves the English rendering byte for byte', () => {
    expect(localizeArticleControls(copyButton, 'en')).toBe(copyButton)
  })

  test('uses the authoritative article format when translation metadata omits it', () => {
    const opening = '<p data-article-format="">Article</p><p>Texto traducido.</p>'
    const sample = '<script>const sample = \'<p data-article-format="">Article</p>\';</script>'

    expect(localizeArticleControls(opening + sample, 'es', 'Guide')).toBe(
      '<p data-article-format="">Guía</p><p>Texto traducido.</p>' + sample
    )
    expect(localizeArticleControls(opening, 'en', 'Guide')).toBe(
      '<p data-article-format="">Guide</p><p>Texto traducido.</p>'
    )
  })

  test('localizes idle, copied, and error behavior without changing copied code', () => {
    const spanish = localizeArticleControls(copyButton, 'es')

    expect(spanish).toContain('aria-label="Copiar código al portapapeles"')
    expect(spanish).toContain('data-copy-copied-label="Código copiado al portapapeles"')
    expect(spanish).toContain('data-copy-error-label="No se pudo copiar el código. Selecciónalo y cópialo manualmente."')
    expect(spanish).toContain('lang="es-419">Copiar</span>')
    expect(spanish).toContain('data-copy-value="const message = &quot;Copy&quot;;"')
  })

  test('preserves authored prose, unrelated attributes, escaped code, and raw-text samples', () => {
    const untouched = [
      '<p title="Copy code to clipboard">Copy is a useful command. Show full example is the label.</p>',
      '<pre><code>&lt;span data-slot="copy-idle"&gt;Copy&lt;/span&gt;</code></pre>',
      '<script>const sample = \'<button data-ui-code-copy="" aria-label="Copy code to clipboard">\';</script>',
      '<script>const sample = \'</style><span data-slot="copy-idle">Copy</span>\';</script>',
      '<textarea><span data-slot="copy-idle">Copy</span></textarea>',
      '<style>.sample::before { content: \'<span data-slot="copy-idle">Copy</span>\' }</style>'
    ].join('\n')

    expect(localizeArticleControls(untouched, 'es')).toBe(untouched)
  })

  test('translates real generated code, fold, preview, and scroll controls', async () => {
    const code = Array.from({ length: 30 }, (_, index) => `const copy${index} = "Copy";`).join('\n')
    const english = await renderArticleCode({ code, codeLabel: 'literal-example.ts', label: 'example.ts', language: 'ts' })
    const spanish = localizeArticleControls(english, 'es')

    expect(spanish).toContain('>Ver el ejemplo completo</span>')
    expect(spanish).toContain('>Contraer ejemplo</span>')
    expect(spanish).toContain('30 líneas · Se copia el ejemplo completo')
    expect(spanish).toContain('Desplázate horizontalmente para leer más')
    expect((/data-copy-value="[^"]*"/u.exec(spanish))?.[0]).toBe((/data-copy-value="[^"]*"/u.exec(english))?.[0])
    expect(spanish).toContain('literal-example.ts')
  })

  test('translates table controls while retaining authored headings', () => {
    const english = '<div data-article-table-folio=""><div data-scroll-cue-message="" hidden><svg></svg><span>Scroll horizontally to compare</span></div><div data-prose-table="" aria-label="Table 2: Deployment options"><table><tr><td>Copy</td></tr></table></div></div>'
    const spanish = localizeArticleControls(english, 'es')

    expect(spanish).toContain('aria-label="Tabla 2: Deployment options"')
    expect(spanish).toContain('lang="es-419">Desplázate horizontalmente para comparar</span>')
    expect(spanish).toContain('<td>Copy</td>')
  })

  test('localizes imported copy controls when the command contains angle brackets', async () => {
    const code = 'export const compare = (value: number): boolean => value > 3 && value < 9'
    const english = await renderArticleCode({ code, codeLabel: 'compare.ts', label: 'compare.ts', language: 'ts' })
    const spanish = localizeArticleControls(english, 'es')

    expect(spanish).toContain('aria-label="Copiar código al portapapeles"')
    expect(spanish).toContain('title="Copiar código al portapapeles"')
    expect(spanish).toContain('data-copy-label="Copiar código al portapapeles"')
    expect(spanish).toContain('data-copy-copied-label="Código copiado al portapapeles"')
    expect(spanish).toContain('data-copy-error-label="No se pudo copiar el código. Selecciónalo y cópialo manualmente."')
    expect(spanish).toContain('lang="es-419">Copiar</span>')
    expect((/data-copy-value="[^"]*"/u.exec(spanish))?.[0]).toBe((/data-copy-value="[^"]*"/u.exec(english))?.[0])
    expect(localizeArticleControls(english, 'en')).toBe(english)
  })
})
