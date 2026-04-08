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
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off'
    },
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
    name: 'website/better-tailwindcss-timeout-workaround',
    files: ['src/components/atoms/BackToTop.astro'],
    rules: {
      'better-tailwindcss/enforce-canonical-classes': 'off'
    }
  }
]
