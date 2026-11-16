// Astro Doctor (`@santi020k/astro-doctor`) reads this file in CI.
export default {
  overrides: [
    {
      files: ['src/components/article/ArticleCode.astro'],
      rules: {
        // renderArticleCode creates a literal code node and serializes escaped HAST
        // text/attributes; it never accepts raw HTML. Doctor cannot infer this boundary.
        // Keep this exception limited to that sink and its malicious-input regressions
        // in src/utils/__tests__/article-code.test.ts when changing the renderer.
        'astro-doctor/no-set-html': 'off'
      }
    }
  ]
}
