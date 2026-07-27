// @ts-check

import { defineConfig, Extension, Testing } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  detectRootDir: import.meta.dirname,
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
      '^section-container-wide$',
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
  name: 'website/playwright-rules',
  files: ['tests/**/*.ts'],
  rules: {
    'playwright/no-focused-test': 'error',
    'playwright/no-skipped-test': 'warn'
  }
})
