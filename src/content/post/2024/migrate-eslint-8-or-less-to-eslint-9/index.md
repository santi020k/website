---
title: "Migrate ESLint 8 or Less to ESLint 9"
description: "A practical guide to moving from ESLint 8 to flat config in ESLint 9, with a cleaner setup for React, Next.js, and TypeScript projects."
publishDate: "2024-05-19T15:41:30.167Z"
tags: ["eslint", "typescript", "react", "nextjs", "migration"]
coverImage:
  alt: "Neon illustration of a legacy ESLint configuration migrating into a modern flat config panel"
  src: "./cover.webp"
postType: "Guide"
seriesId: "eslint-in-practice"
seriesOrder: 1
---

[Read the Previous Post: Authentication and Authorization in Next.js Applications with Supabase](/blog/authentication-and-authorization-in-next-js-applications-with-supabase/)

In [Building the Best Next.js TypeScript Standard Vitest ESLint Configuration](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7), I shared the ESLint base that I liked to use in frontend projects. That setup worked well for ESLint 8, but ESLint 9 changed something important: flat config stopped being "the new way" and became the default way.

If you are still on `.eslintrc`, this migration is a good opportunity to simplify your setup instead of dragging legacy configuration forward. I do not like leaving important quality decisions hidden in editor defaults, weak conventions, or half-maintained plugin presets. The larger the team, the more expensive those invisible defaults become.

[Related post: Building the Best Next.js TypeScript Standard Vitest ESLint Configuration](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7)

[GitHub Repository](https://github.com/santi020k/eslint-config-basic)

## Why this migration matters

ESLint 9 is not just a version bump.

- Flat config becomes the default configuration system.
- Shareable configs are imported as modules instead of referenced as strings.
- Ignore patterns move into the config instead of living in `.eslintignore`.
- Some formatters were removed from core.
- Older Node versions are no longer supported.

I actually think this is a good direction. In frontend projects, too many defaults create confusion. One rule comes from a plugin, another from the editor, another from a hidden preset, and after a few months nobody remembers why the codebase behaves the way it does.

With flat config, the setup becomes more explicit. That is exactly what I want in a serious project.

![Diagram comparing a layered eslintrc setup with a more explicit flat config setup](./fig-1.webp)

## 1. Confirm the runtime before touching the config

Before changing any rule or file name, verify the Node version used by:

- Your local terminal
- CI
- Your editor ESLint integration

ESLint 9 drops support for older runtimes, so this is the first thing I check. If your team is still tied to an old Node version in CI or inside VS Code, the CLI may work on one machine and fail on another.

At minimum, update the package first:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```json title="package.json"
{
  "devDependencies": {
    "eslint": "^9.0.0"
  }
}
```

Then install again:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
pnpm install
```

If you are doing the migration today, the same flat-config shape also makes the later move to ESLint 10 much easier.

## 2. Generate the first version, but do not stop there

The official ESLint migrator is the fastest way to get an existing project moving:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npx @eslint/migrate-config .eslintrc.cjs
```

If your old config lives in JSON or YAML, use that file instead. The useful part of this command is not that it gives you a perfect result. The useful part is that it removes the repetitive translation work so you can focus on the parts that actually require judgment.

This is especially helpful when the project has:

- Multiple overrides
- Old shareable configs
- A `.eslintignore` file
- Plugins that are not fully updated yet

The generated file is usually a bridge, not the final version. Keep that in mind from the beginning.

## 3. Replace legacy strings with imported configuration

One of the biggest mental shifts in ESLint 9 is that the configuration is just JavaScript modules. That means I no longer want this:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title=".eslintrc.cjs"
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  env: {
    browser: true,
    node: true
  },
  ignorePatterns: ['dist', 'coverage']
}
```

I prefer something closer to this:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', '**/.*']
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }
])
```

There are a few important differences here:

- `eslint:recommended` is now imported from `@eslint/js`.
- TypeScript config is imported directly instead of referenced through `extends`.
- `env` becomes explicit globals in `languageOptions`.
- `.eslintignore` patterns become `ignores`.

This is more verbose, yes. It is also much clearer.

## 4. Use `FlatCompat` only as a transition layer

Not every dependency was ready for flat config at the same time. When that happens, `FlatCompat` is useful:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { FlatCompat } from '@eslint/eslintrc'
import { defineConfig } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default defineConfig([
  ...compat.extends('eslint-config-my-config')
])
```

I see this as a temporary bridge, not the final architecture.

If a config still depends on `FlatCompat`, I try to answer two questions:

1. Can I upgrade the dependency to a flat-config-ready version?
2. If not, can I replace it with something more explicit and easier to maintain?

Compatibility layers are useful, but every compatibility layer is future cleanup debt.

## 5. Move ignore behavior into the config on purpose

This part is easy to miss if you migrate too fast.

With flat config, `.eslintignore` is not where I want to manage lint ignores anymore. I prefer the ignore rules to live beside the rest of the lint setup so the behavior is visible in one place.

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.astro/**',
      '**/.*'
    ]
  }
])
```

Two details matter here:

- `temp.js` in `.eslintignore` usually becomes `**/temp.js` in flat config.
- Dotfiles are not ignored by default, so if you want that behavior you need to declare it.

This is another reason I like the new format. Hidden ignore behavior is one of those small things that creates a lot of confusion in large teams.

## 6. A cleaner frontend setup with `@santi020k/eslint-config-basic`

After migrating enough projects, I got tired of rebuilding the same frontend setup over and over again. That is why I moved my standards into [`@santi020k/eslint-config-basic`](https://eslint.santi020k.com/).

The simplest version is:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { eslintConfig } from '@santi020k/eslint-config-basic'

export default eslintConfig()
```

That already gives you a strong starting point and auto-detects common project signals from `package.json`.

When I want to be more explicit, I prefer something like this:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import {
  eslintConfig,
  Library,
  Testing
} from '@santi020k/eslint-config-basic'

export default eslintConfig({
  libraries: [Library.Tailwind],
  testing: [Testing.Vitest, Testing.TestingLibrary],
  strict: true,
  typescript: true
})
```

This approach fits the way I like to work:

- Strong defaults
- Fewer repeated decisions
- Explicit options when the project needs them
- Less dependence on editor-specific behavior

For frontend teams, that matters a lot. I do not want quality to depend on whether one developer installed the right extension or remembered the right lint preset six months ago.

![Diagram showing a migration path from legacy eslint config to a reusable explicit flat config setup](./fig-2.webp)

## 7. Final migration checklist

Before merging the migration PR, I recommend checking these points:

- Upgrade Node first, then ESLint.
- Generate the first flat config with the official migrator if the project is large.
- Replace string-based `extends` with imported configs where possible.
- Move `.eslintignore` patterns into `ignores`.
- Keep `FlatCompat` only for dependencies that still need it.
- Review CI if you were using core formatters that ESLint 9 removed.
- Avoid mixing the config migration with thousands of unrelated auto-fixes in the same PR.

That last point is important. I do not recommend migrating the config and rewriting half the codebase in the same pull request. Separate the structural migration from mass rule fixes whenever possible. It makes review easier and it reduces risk.

## Conclusion

Migrating to ESLint 9 is less about syntax and more about ownership.

You stop inheriting configuration by accident and start composing it on purpose. For me, that is the real value of the change. It pushes frontend projects toward a setup that is easier to read, easier to reason about, and easier to maintain over time.

That is also the same reason I keep investing in `@santi020k/eslint-config-basic`: I want fewer magic defaults and more standards declared clearly in code.

If you are still on ESLint 8 or lower, this is a very good moment to clean up the foundation instead of just upgrading the version number.

[Next Post: Boosting Code Quality and Efficiency with My ESLint Configuration Library](https://towardsdev.com/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library-3a4cbc1993a7)
