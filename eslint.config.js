import recommended from '@santi020k/eslint-config-full/recommended'

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
