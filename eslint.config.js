// @ts-check

import astroConfig from '@santi020k/eslint-config-astro'
import { eslintConfig } from '@santi020k/eslint-config-basic'
import reactConfig from '@santi020k/eslint-config-react'

export default [
  // --- Base presets from your package ---
  ...eslintConfig({
    typescript: true,
    frameworks: {
      astro: astroConfig,
      react: reactConfig
    }
  })
]
