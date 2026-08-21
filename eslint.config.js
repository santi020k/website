import recommended from '@santi020k/eslint-config-full/recommended'

// Tailwind v4 initialization can exceed Synckit's one-minute default on CI.
// Keep the canonical-class rule enabled and give its worker enough time.
process.env.SYNCKIT_TIMEOUT ??= '180000'

export default [
  ...recommended,
  {
    name: 'website/project-tailwind-classes',
    rules: {
      'better-tailwindcss/no-unknown-classes': ['error', {
        ignore: [
          'e-content',
          'h-entry',
          'not-prose',
          'p-name',
          'p-summary',
          'post-meta-card',
          'principle-card',
          'prose-shell',
          'u-url'
        ]
      }]
    }
  }
]
