// @ts-check
import { ConfigOption, eslintConfig, OptionalOption } from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({
    config: [ConfigOption.Ts, ConfigOption.Astro],
    optionals: [
      OptionalOption.Cspell,
      OptionalOption.Tailwind,
      OptionalOption.Vitest
      // OptionalOption.Mdx,
      // OptionalOption.Markdown
    ]
  }),
  {
    name: 'custom-rules',
    // TODO: Temporal Eslint Fix
    rules: {
      'react/display-name': 'off',
      'react/jsx-key': 'off',
      'react/jsx-no-comment-textnodes': 'off',
      'react/jsx-no-duplicate-props': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/no-children-prop': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/self-closing-comp': 'off',
      'react/sort-comp': 'off',
      'react/void-dom-elements-no-children': 'off',
      'react/jsx-no-undef': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'off',
      'react/no-unknown-property': 'off',
      'react/no-array-index-key': 'off',
      'react/no-danger': 'off',
      'react/no-deprecated': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/no-find-dom-node': 'off',
      'react/no-is-mounted': 'off',
      'react/no-multi-comp': 'off',
      'react/no-render-return-value': 'off',
      'react/no-set-state': 'off',
      'react/no-string-refs': 'off',
      'react/prefer-es6-class': 'off',
      'react/prefer-stateless-function': 'off',
      'react/no-danger-with-children': 'off',
      'react/require-render-return': 'off',
      'astro/missing-client-only-directive-value': 'off'
    }
  }
]
