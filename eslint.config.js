// @ts-check
import eslintPluginAstro from 'eslint-plugin-astro'

import { ConfigOption, eslintConfig, OptionalOption, SettingOption } from '@santi020k/eslint-config-basic'

export default [
  // --- Base presets from your package ---
  ...eslintConfig({
    config: [ConfigOption.Astro, ConfigOption.Ts],
    optionals: [
      OptionalOption.Tailwind,
      OptionalOption.Mdx,
      OptionalOption.Cspell,
      OptionalOption.Vitest
    ],
    settings: [SettingOption.Gitignore] // honor your .gitignore
  }),

  // --- Astro plugin recommended (parser + rules for .astro) ---
  // Use recommended base rules that prevent common errors in Astro components.
  ...eslintPluginAstro.configs['flat/recommended'],

  // --- Astro accessibility rules (optional but encouraged) ---
  // Choose one: 'flat/jsx-a11y-recommended' or stricter 'flat/jsx-a11y-strict'.
  ...eslintPluginAstro.configs['flat/jsx-a11y-recommended'],

  // --- Local project overrides ---
  {
    files: ['**/*.astro'],
    rules: {
      // Example: escalate potentially dangerous HTML directive usage.
      // 'astro/no-set-html-directive': 'error',

      // React-specific rules don't apply cleanly in Astro templates;
      // disable if they’re noisy (adjust as you see fit).
      'react/jsx-no-undef': 'off',
      'react/react-in-jsx-scope': 'off',
      '@stylistic/comma-dangle': ['warn', 'never'],
      'react/no-unescaped-entities': 'off',
      '@stylistic/quote-props': ['warn', 'as-needed'],
      'no-unused-vars': 'off'
    }
  },

  // Scripts emitted from <script> blocks inside .astro get virtual filenames
  // like *.astro/*.js or *.astro/*.ts. You can tweak rules for those here.
  {
    files: ['**/*.astro/*.js', '*.astro/*.js'],
    languageOptions: { sourceType: 'module' },
    rules: {
      // Prevent double formatting noise if you also run Prettier on .astro files.
      'prettier/prettier': 'off'
    }
  },
  {
    files: ['**/*.astro/*.ts', '*.astro/*.ts'],
    languageOptions: { sourceType: 'module' }
    // Additional TS-specific rules can go here if needed.
  }
]
