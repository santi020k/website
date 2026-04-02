// @ts-check

import astroConfig from '@santi020k/eslint-config-astro'
import { eslintConfig, Testing } from '@santi020k/eslint-config-basic'
import reactConfig from '@santi020k/eslint-config-react'

export default [
  // --- Base presets from your package ---
  ...eslintConfig({
    typescript: true,
    frameworks: {
      astro: astroConfig,
      react: reactConfig
    },
    testing: [Testing.Vitest]
  }),
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
        detectComponentClasses: true,
        ignore: ['^not-prose$', '^prose-santi$']
      }
    }
  }
]
