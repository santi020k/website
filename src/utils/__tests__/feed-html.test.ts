import { describe, expect, test } from 'vitest'

import { toFeedHtml } from '../feed-html'

const articleUrl = new URL('https://santi020k.com/blog/why-i-moved-to-zed/')

describe('feed article HTML', () => {
  test('keeps the text and points links and images at absolute URLs', () => {
    const html = toFeedHtml([
      '<p>See <a href="/portfolio/dep-beacon/" rel="nofollow" target="_blank">Dep Beacon</a>',
      ' and <a href="#install">the install step</a>.</p>',
      '<p><img src="/_astro/diagram.Bx1.webp" srcset="/_astro/diagram.Bx2.webp 2x" alt="Install flow" width="800" height="400" loading="lazy"></p>',
      '<p><a href="mailto:hi@santi020k.com">Write to me</a></p>'
    ].join(''), articleUrl)

    expect(html).toBe([
      '<p>See <a href="https://santi020k.com/portfolio/dep-beacon/">Dep Beacon</a>',
      ' and <a href="https://santi020k.com/blog/why-i-moved-to-zed/#install">the install step</a>.</p>',
      '<p><img src="https://santi020k.com/_astro/diagram.Bx1.webp" alt="Install flow" width="800" height="400"></p>',
      '<p><a href="mailto:hi@santi020k.com">Write to me</a></p>'
    ].join(''))
  })

  test('drops page controls, icons, hidden panels, print references, and the format label', () => {
    const html = toFeedHtml([
      '<div data-article-margin-lead id="article-opening"><p data-article-format>Opinion</p><p data-article-lead>The lead.</p></div>',
      '<h2 id="setup" data-article-section-heading><span data-article-heading-text>Setup</span><button type="button">Copy link</button></h2>',
      '<p>Text<sup data-print-reference><a href="#article-print-reference-1">1</a></sup>.</p>',
      '<div role="tabpanel"><p>npm install</p></div><div role="tabpanel" hidden><p>yarn add</p></div>',
      '<p><svg aria-hidden="true"><path d="M0 0"/></svg><span aria-hidden="true">→</span>Next</p>',
      '<script>alert(1)</script><style>p{}</style><template><p>Later</p></template>',
      '<div class="ui-scroll-cue" hidden><span>Scroll horizontally to read more</span></div>'
    ].join(''), articleUrl)

    expect(html).toBe('<div><p>The lead.</p></div><h2>Setup</h2><p>Text.</p><div><p>npm install</p></div><p>Next</p>')
  })

  test('turns highlighted code into plain text and keeps a code title but not the language badge', () => {
    const html = toFeedHtml([
      '<figure data-rehype-pretty-code-figure><figcaption class="ui-code__header"><span class="ui-code__meta">',
      '<span data-prose-code-language>ts</span><span class="ui-code__label">astro.config.ts</span></span>',
      '<button type="button">Copy</button></figcaption>',
      '<pre class="shiki" style="--shiki-light:#000" tabindex="0"><code data-line-numbers style="display:grid">',
      '<span data-line><span class="sk-1">const</span> <span class="sk-2">a</span> = <span class="sk-3">1</span></span>\n',
      '<span data-line><span class="sk-1">export</span> default a &lt; 2</span>\n',
      '</code></pre></figure>',
      '<figure><figcaption><span data-prose-code-language>bash</span></figcaption><pre><code>npm test</code></pre></figure>'
    ].join(''), articleUrl)

    expect(html).toBe([
      '<figure><figcaption>astro.config.ts</figcaption><pre><code>const a = 1\nexport default a &lt; 2</code></pre></figure>',
      '<figure><pre><code>npm test</code></pre></figure>'
    ].join(''))
  })

  test('opens a folded code example once, without its preview or its toggle', () => {
    const html = toFeedHtml([
      '<figure><details data-example-fold><summary><span data-fold-expand>Show full example</span>',
      '<span data-fold-count>36 lines</span></summary><div data-code-fold-region><pre><code>line 1\nline 2\nline 36</code></pre></div></details>',
      '<div data-code-fold-region data-code-preview><pre><code>line 1\nline 2</code></pre></div></figure>'
    ].join(''), articleUrl)

    expect(html).toBe('<figure><div><pre><code>line 1\nline 2\nline 36</code></pre></div></figure>')
  })

  test('removes blocks left empty and keeps tables and lists readable', () => {
    const html = toFeedHtml([
      '<div class="wrapper"><span> </span></div>',
      '<table class="readable"><thead><tr><th scope="col" class="x">Tool</th></tr></thead><tbody><tr><td colspan="2">Zed</td></tr></tbody></table>',
      '<ol start="3" class="steps"><li>Third</li></ol>'
    ].join(''), articleUrl)

    expect(html).toBe([
      '<table><thead><tr><th scope="col">Tool</th></tr></thead><tbody><tr><td colspan="2">Zed</td></tr></tbody></table>',
      '<ol start="3"><li>Third</li></ol>'
    ].join(''))
  })
})
