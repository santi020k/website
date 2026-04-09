// @ts-check

import astroConfig from '@santi020k/eslint-config-astro'
import { eslintConfig, Testing } from '@santi020k/eslint-config-basic'

export default [
  // --- Base presets from your package ---
  ...eslintConfig({
    typescript: true,
    frameworks: {
      astro: astroConfig
    },
    testing: [Testing.Vitest]
  }),
  {
    name: 'website/astro-parser-fix',
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: {
        project: true,
        projectService: false
      }
    }
  },
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
        detectComponentClasses: true,
        ignore: [
          '^not-prose$',
          '^prose-santi$',
          '^grid-fade$',
          '^panel-surface$',
          '^prose-shell$',
          '^pagefind-ui-wrap$'
        ]
      }
    }
  },
  {
    // Astro template expressions currently trigger false positives for this rule.
    name: 'website/astro-template-typescript-workaround',
    files: ['**/*.astro'],
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  }
]
