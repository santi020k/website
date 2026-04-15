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
    name: 'website/typescript-project-fix',
    files: ['**/*.{ts,tsx,astro}'],
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
          '^prose-shell$'
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
  },
  {
    // @stylistic/jsx-indent-props conflicts with @stylistic/indent in Astro files
    // because Astro templates are not JSX — disable the JSX-specific variant.
    name: 'website/astro-indent-conflict-fix',
    files: ['**/*.astro'],
    rules: {
      '@stylistic/jsx-indent-props': 'off'
    }
  }
]
