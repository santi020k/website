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
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/styles/global.css',
        detectComponentClasses: true,
        ignore: ['^not-prose$', '^prose-santi$', '^grid-fade$', '^panel-surface$', '^prose-shell$']
      }
    }
  }
]
