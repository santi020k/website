// Astro Doctor (`@santi020k/astro-doctor`) reads this file in CI.
export default {
  overrides: [
    {
      // ArticleCode renders markup from the site's own code highlighter: the source text enters as
      // an escaped Markdown code node, so its `set:html` never carries visitor input.
      files: ['src/components/article/ArticleCode.astro'],
      rules: { 'astro-doctor/no-set-html': 'off' }
    }
  ]
}
