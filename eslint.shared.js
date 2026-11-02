import { defineConfig } from '@santi020k/eslint-config-basic'

process.env.SYNCKIT_TIMEOUT ??= '180000'

/** @param {string} root */
export const createWebsiteConfig = root => defineConfig({
  root,
  preset: 'browser',
  // Every app is validated in its own working directory by the workspace scripts.
  detection: { projects: false },
  tailwind: {},
  testingFiles: { playwright: ['tests/**/*.spec.ts'] }
}, {
  name: 'website/project-tailwind-classes',
  rules: {
    'better-tailwindcss/no-unknown-classes': ['error', {
      ignore: [
        // Microformats2 properties and roots are metadata, not styling utilities.
        'e-content',
        'h-card',
        'h-entry',
        'not-prose',
        'p-author',
        'p-name',
        'p-summary',
        'post-meta-card',
        'principle-card',
        // Reading-layout prose lives in src/styles/prose.css, outside the shared Tailwind entry.
        'prose-project',
        'prose-santi',
        'prose-shell',
        'u-url'
      ]
    }]
  }
})
