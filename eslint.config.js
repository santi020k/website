// @ts-check

import { defineConfig, Extension, Testing } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  detectRootDir: import.meta.dirname,
  ignores: ['**/*.json', '**/*.jsonc', '**/*.md', '**/*.yaml', '**/*.yml'],
  features: {
    'jest-dom': false,
    jsonc: false,
    markdown: false,
    'package-json': false,
    perfectionist: false,
    pnpm: false,
    'testing-library': false,
    yaml: false,
    zod: false
  },
  extensions: [Extension.Security],
  frameworks: {
    astro: true
  },
  tailwind: {
    entryPoint: 'src/styles/global.css',
    ignore: [
      '^not-prose$',
      '^prose-santi$',
      '^grid-fade$',
      '^panel-surface$',
      '^prose-shell$',
      '^animate-spring-up-lcp$',
      '^animate-reveal-lcp$',
      '^border-brand-solid$',
      '^bg-brand-solid$',
      '^hover:bg-brand-solid/92$',
      '^hover:border-brand-solid/35$',
      '^hover:bg-brand-solid$',
      '^dt-published$',
      '^p-name$',
      '^e-content$',
      '^p-summary$',
      '^h-entry$',
      '^u-url$',
      '^gradient-radial$',
      '^tag-glass-card$',
      '^tag-glass-inner$',
      '^tag-glass-tint$',
      '^mini-card$',
      '^shine-effect$',
      '^icon-wrapper$',
      '^arrow-indicator$',
      '^badge$',
      '^principle-card$',
      '^testimonial-card$',
      '^post-meta-card$'
    ]
  },
  testing: [Testing.Vitest, Testing.Playwright],
  testingFiles: {
    playwright: ['tests/**/*.ts']
  }
}, {
  name: 'website/astro-virtual-typescript-project',
  files: ['**/*.astro/*.ts', '**/*.astro/*.tsx'],
  languageOptions: {
    parserOptions: {
      project: true,
      projectService: false
    }
  }
}, {
  // Astro template expressions currently trigger false positives for this rule.
  name: 'website/astro-template-typescript-workaround',
  files: ['**/*.astro'],
  rules: {
    '@typescript-eslint/no-unsafe-return': 'off'
  }
}, {
  // @stylistic/jsx-indent-props conflicts with @stylistic/indent in Astro files
  // because Astro templates are not JSX, disable the JSX-specific variant.
  name: 'website/astro-indent-conflict-fix',
  files: ['**/*.astro'],
  rules: {
    '@stylistic/jsx-indent-props': 'off'
  }
}, {
  name: 'website/playwright-rules',
  files: ['tests/**/*.ts'],
  rules: {
    'playwright/no-focused-test': 'error',
    'playwright/no-skipped-test': 'warn'
  }
})
