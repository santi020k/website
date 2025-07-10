// @ts-check
import { ConfigOption, eslintConfig, OptionalOption } from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({
    config: [ConfigOption.Ts, ConfigOption.Astro],
    optionals: [
      // Spell checker
      OptionalOption.Cspell,
      // TailwindCss
      OptionalOption.Tailwind,
      // Vitest and testing-library
      OptionalOption.Vitest,
      // Mdx
      OptionalOption.Mdx,
      // Markdown
      OptionalOption.Markdown
    ]
  })
]
